import { prisma } from "./prisma";
import { parseJsonField } from "./utils";

interface GameVector {
    id: string;
    title: string;
    coverUrl: string | null;
    genres: string[];
    tags: string[];
}

/**
 * Build a weighted tag/genre frequency map from the user's library.
 * Games the user rated highly, completed, or is actively playing get higher weight.
 */
function buildUserProfile(
    userLibrary: Array<{
        status: string;
        favorite: boolean;
        userRating: number | null;
        game: { genres: string; tags: string };
    }>
): Map<string, { weight: number; original: string }> {
    const profile = new Map<string, { weight: number; original: string }>();

    for (const entry of userLibrary) {
        const genres = parseJsonField<string[]>(entry.game.genres, []);
        const tags = parseJsonField<string[]>(entry.game.tags, []);

        // Status-based weight
        let weight = 1;
        if (entry.status === "COMPLETED") weight = 2;
        else if (entry.status === "PLAYING") weight = 1.5;
        else if (entry.status === "DROPPED") weight = 0.3;

        // Boost favorites
        if (entry.favorite) weight *= 1.5;

        // Boost by user rating (0.5-10 scale, normalized to 0.5-2x multiplier)
        if (entry.userRating != null && entry.userRating > 0) {
            weight *= 0.5 + (entry.userRating / 10) * 1.5;
        }

        for (const tag of [...genres, ...tags]) {
            const normalized = tag.toLowerCase().trim();
            if (!normalized) continue;
            const existing = profile.get(normalized);
            if (existing) {
                existing.weight += weight;
            } else {
                profile.set(normalized, { weight, original: tag });
            }
        }
    }

    return profile;
}

/**
 * Get the top-N tags by accumulated weight from the user profile.
 */
function getTopTags(
    profile: Map<string, { weight: number; original: string }>,
    n: number
): Array<{ normalized: string; original: string; weight: number }> {
    return [...profile.entries()]
        .map(([normalized, { weight, original }]) => ({ normalized, original, weight }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, n);
}

/**
 * Build a Prisma `OR` filter that matches games containing any of the given tags
 * in their `genres` or `tags` JSON string columns (e.g. `contains: '"Action"'`).
 */
function buildTagFilter(topTags: Array<{ original: string }>) {
    const conditions: Array<Record<string, unknown>> = [];
    for (const { original } of topTags) {
        // Match the JSON-encoded string value, e.g. `"Action"` inside `["Action","RPG"]`
        const needle = `"${original}"`;
        conditions.push({ genres: { contains: needle } });
        conditions.push({ tags: { contains: needle } });
    }
    return conditions;
}

/**
 * Content-based recommendation engine.
 * Uses tag/genre similarity with database-level candidate filtering
 * to stay fast even with 300K+ games in the catalog.
 */
export async function getRecommendations(
    userId: string,
    limit: number = 10
): Promise<Array<GameVector & { score: number; reason: string }>> {
    // 1. Get user's games with their tags, rating, and status
    const userLibrary = await prisma.userGameLibrary.findMany({
        where: { userId },
        include: { game: true },
    });

    if (userLibrary.length === 0) return [];

    // 2. Build user preference profile
    const profile = buildUserProfile(userLibrary);
    if (profile.size === 0) return [];

    // 3. Extract top-10 most weighted tags for DB filtering
    const topTags = getTopTags(profile, 10);

    // 4. Query only candidate games that match at least one top tag
    //    (database-level filtering avoids loading the entire catalog)
    const userGameIds = new Set(userLibrary.map((e) => e.gameId));
    const orConditions = buildTagFilter(topTags);

    const candidates = await prisma.game.findMany({
        where: {
            id: { notIn: [...userGameIds] },
            OR: orConditions,
        },
        take: 1000, // cap to keep memory bounded
    });

    // If DB filtering returned nothing, fallback to top-rated games
    if (candidates.length === 0) {
        const fallback = await prisma.game.findMany({
            where: { id: { notIn: [...userGameIds] }, rating: { not: null } },
            orderBy: { rating: "desc" },
            take: limit,
        });
        return fallback.map((game) => ({
            id: game.id,
            title: game.title,
            coverUrl: game.coverUrl,
            genres: parseJsonField<string[]>(game.genres, []),
            tags: parseJsonField<string[]>(game.tags, []),
            score: game.rating ?? 0,
            reason: "Highly rated",
        }));
    }

    // 5. Score each candidate against the full user profile
    const scored = candidates.map((game) => {
        const genres = parseJsonField<string[]>(game.genres, []);
        const tags = parseJsonField<string[]>(game.tags, []);
        const allTags = [...genres, ...tags].map((t) => t.toLowerCase().trim());

        let score = 0;
        const matchedTags: string[] = [];

        for (const tag of allTags) {
            const entry = profile.get(tag);
            if (entry) {
                score += entry.weight;
                matchedTags.push(tag);
            }
        }

        // Normalize to avoid bias toward games with many tags
        const normalizedScore = allTags.length > 0 ? score / Math.sqrt(allTags.length) : 0;

        // Small boost for games that have a high external rating
        const ratingBoost = game.rating ? game.rating / 100 : 0;

        return {
            id: game.id,
            title: game.title,
            coverUrl: game.coverUrl,
            genres,
            tags,
            score: normalizedScore + ratingBoost,
            reason:
                matchedTags.length > 0
                    ? `Matches: ${matchedTags.slice(0, 3).join(", ")}`
                    : "Discover something new",
        };
    });

    // 6. Sort by score descending and return top N
    return scored
        .filter((g) => g.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Find similar games to a specific game.
 * Uses database-level tag filtering to avoid loading the entire catalog.
 */
export async function getSimilarGames(
    gameId: string,
    limit: number = 6
): Promise<Array<GameVector & { score: number }>> {
    const sourceGame = await prisma.game.findUnique({ where: { id: gameId } });
    if (!sourceGame) return [];

    const sourceGenres = parseJsonField<string[]>(sourceGame.genres, []);
    const sourceTags = parseJsonField<string[]>(sourceGame.tags, []);
    const sourceAll = [...sourceGenres, ...sourceTags];

    if (sourceAll.length === 0) return [];

    // Pick up to 10 tags for the DB filter
    const filterTags = sourceAll.slice(0, 10);
    const orConditions: Array<Record<string, unknown>> = [];
    for (const tag of filterTags) {
        const needle = `"${tag}"`;
        orConditions.push({ genres: { contains: needle } });
        orConditions.push({ tags: { contains: needle } });
    }

    const candidates = await prisma.game.findMany({
        where: {
            id: { not: gameId },
            OR: orConditions,
        },
        take: 500,
    });

    // Compute Jaccard similarity on the reduced pool
    const sourceVector = sourceAll.map((t) => t.toLowerCase().trim());
    const sourceSet = new Set(sourceVector);

    const scored = candidates.map((game) => {
        const genres = parseJsonField<string[]>(game.genres, []);
        const tags = parseJsonField<string[]>(game.tags, []);
        const gameVector = [...genres, ...tags].map((t) => t.toLowerCase().trim());

        const intersection = gameVector.filter((t) => sourceSet.has(t)).length;
        const union = new Set([...sourceVector, ...gameVector]).size;
        const score = union > 0 ? intersection / union : 0;

        return {
            id: game.id,
            title: game.title,
            coverUrl: game.coverUrl,
            genres,
            tags,
            score,
        };
    });

    return scored
        .filter((g) => g.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
