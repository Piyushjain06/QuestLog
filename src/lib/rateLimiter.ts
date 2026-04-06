/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 30 });
 *   const result = limiter.check(identifier);
 *   if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 *
 * Designed for Next.js API routes running in Node.js (not Edge Runtime).
 * For multi-instance / serverless deployments, replace with Redis.
 */

interface RateLimiterOptions {
    windowMs: number; // sliding window duration in milliseconds
    max: number;      // maximum requests per window
}

interface RateLimiterResult {
    allowed: boolean;
    remaining: number;
    resetAt: number; // ms timestamp when the window resets
}

interface Store {
    [key: string]: number[]; // timestamps of hits
}

export function createRateLimiter(options: RateLimiterOptions) {
    const { windowMs, max } = options;
    const store: Store = {};

    // Prune the store every 5 minutes to prevent unbounded memory growth
    const pruneInterval = setInterval(() => {
        const now = Date.now();
        for (const key of Object.keys(store)) {
            store[key] = store[key].filter((t) => now - t < windowMs);
            if (store[key].length === 0) delete store[key];
        }
    }, 5 * 60 * 1000);

    // Don't block process exit
    if (pruneInterval.unref) pruneInterval.unref();

    return {
        check(identifier: string): RateLimiterResult {
            const now = Date.now();
            const hits = (store[identifier] ?? []).filter((t) => now - t < windowMs);
            hits.push(now);
            store[identifier] = hits;

            const allowed = hits.length <= max;
            const oldest = hits[0] ?? now;
            return {
                allowed,
                remaining: Math.max(0, max - hits.length),
                resetAt: oldest + windowMs,
            };
        },
    };
}

// ── Shared limiter instances ──────────────────────────────────────────────────

/** For unauthenticated / authenticated game search, IGDB proxy endpoints */
export const searchLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });

/** For friend requests — prevent social spam */
export const friendRequestLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

/** For Steam import — expensive operation */
export const steamImportLimiter = createRateLimiter({ windowMs: 5 * 60_000, max: 3 });

/** For user search */
export const userSearchLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });
