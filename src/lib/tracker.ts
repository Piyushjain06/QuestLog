// Tracker.gg v2 API client
// Docs: https://tracker.gg/developers

const TRACKER_API_BASE = "https://public-api.tracker.gg/v2";

// ────── Supported Games & Platforms ──────

export const TRACKER_GAMES = {
    apex: { label: "Apex Legends", platforms: ["origin", "xbl", "psn"] },
    "division-2": { label: "The Division 2", platforms: ["uplay", "xbl", "psn"] },
} as const;

export type TrackerGame = keyof typeof TRACKER_GAMES;

export const PLATFORM_LABELS: Record<string, string> = {
    origin: "EA / Origin",
    xbl: "Xbox Live",
    psn: "PlayStation",
    uplay: "Ubisoft Connect",
};

// ────── Response Types ──────

export interface TrackerStat {
    rank: number | null;
    percentile: number | null;
    displayName: string;
    displayCategory: string;
    category: string | null;
    value: number;
    displayValue: string;
    displayType: string;
}

export interface TrackerSegment {
    type: string; // "overview", "legend", etc.
    attributes: Record<string, string>;
    metadata: {
        name?: string;
        imageUrl?: string;
        tallImageUrl?: string;
        bgImageUrl?: string;
    };
    expiryDate: string;
    stats: Record<string, TrackerStat>;
}

export interface TrackerProfile {
    platformInfo: {
        platformSlug: string;
        platformUserId: string;
        platformUserHandle: string;
        platformUserIdentifier: string;
        avatarUrl: string | null;
    };
    userInfo: {
        userId: string | null;
        isPremium: boolean;
        isVerified: boolean;
        isInfluencer: boolean;
    };
    metadata?: Record<string, unknown>;
    segments: TrackerSegment[];
    availableSegments: Array<{
        type: string;
        attributes: Record<string, string>;
        metadata: Record<string, string>;
    }>;
    expiryDate: string;
}

export interface TrackerApiResponse {
    data: TrackerProfile;
}

export interface TrackerApiError {
    errors: Array<{
        code: string;
        message: string;
    }>;
}

// ────── API Client ──────

export async function fetchTrackerProfile(
    game: string,
    platform: string,
    username: string
): Promise<TrackerProfile> {
    const apiKey = process.env.TRACKER_API_KEY;
    if (!apiKey) {
        throw new Error("TRACKER_API_KEY is not configured");
    }

    const url = `${TRACKER_API_BASE}/${encodeURIComponent(game)}/standard/profile/${encodeURIComponent(platform)}/${encodeURIComponent(username)}`;

    const res = await fetch(url, {
        headers: {
            "TRN-Api-Key": apiKey,
            Accept: "application/json",
        },
        next: { revalidate: 300 }, // cache for 5 minutes
    });

    if (!res.ok) {
        let errorMessage = `Tracker.gg API error: ${res.status}`;
        try {
            const errorBody = (await res.json()) as TrackerApiError;
            if (errorBody.errors?.[0]?.message) {
                errorMessage = errorBody.errors[0].message;
            }
        } catch {
            // ignore parse errors
        }
        throw new Error(errorMessage);
    }

    const body = (await res.json()) as TrackerApiResponse;
    return body.data;
}
