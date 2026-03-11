import { prisma } from "./prisma";
import { parseJsonField } from "./utils";
import { getRecommendedGames, getTrendingGames } from "./igdb";
import type { NormalizedGame } from "./igdb";

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
    return Array.from(profile.entries())
        .map(([normalized, { weight, original }]) => ({ normalized, original, weight }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, n);
}

/**
 * IGDB-powered content-based recommendation engine.
 * Builds user preferences from their local library, then queries IGDB
 * for highly-rated games matching those genres/themes.
 */
export async function getRecommendations(
    userId: string,
    limit: number = 12,
    additionalExcludeIds: number[] = []
): Promise<Array<NormalizedGame & { score: number; reason: string }>> {
    // 1. Get user's games with their tags, rating, and status
    const userLibrary = await prisma.userGameLibrary.findMany({
        where: { userId },
        include: {
            game: {
                include: {
                    genres: { include: { genre: true } },
                }
            }
        },
    });

    if (userLibrary.length === 0) return [];

    const mappedLibrary = userLibrary.map((entry: any) => ({
        ...entry,
        game: {
            ...entry.game,
            genres: JSON.stringify(entry.game.genres?.map((g: any) => g.genre.name) || []),
            tags: JSON.stringify([]),
        }
    }));

    // 2. Build user preference profile
    const profile = buildUserProfile(mappedLibrary);
    if (profile.size === 0) return [];

    // 3. Extract top genres/themes for IGDB query
    const topTags = getTopTags(profile, 8);
    const genreNames = topTags.map((t) => t.original);

    // 4. Collect IGDB IDs of games already in the user's library to exclude,
    //    plus any previously shown recommendation IDs (for refresh support)
    const excludeIgdbIds: number[] = [...additionalExcludeIds];
    for (const entry of userLibrary) {
        if (entry.game.igdbId) {
            excludeIgdbIds.push(Number(entry.game.igdbId));
        }
    }

    // 5. Query IGDB for recommended games matching those genres
    const candidates = await getRecommendedGames(genreNames, excludeIgdbIds, limit * 2);

    if (candidates.length === 0) {
        // Fallback to trending games
        const trending = await getTrendingGames(limit);
        return trending.map((game) => ({
            ...game,
            score: 0,
            reason: "Trending right now",
        }));
    }

    // 6. Score each candidate against the full user profile for personalization
    const scored = candidates.map((game) => {
        const allTags = [...game.genres, ...(game.themes || [])].map((t) => t.toLowerCase().trim());

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

        // Boost for IGDB rating
        const ratingBoost = typeof game.rating === 'number' ? game.rating / 100 : 0;

        return {
            ...game,
            score: normalizedScore + ratingBoost,
            reason:
                matchedTags.length > 0
                    ? `Matches: ${Array.from(new Set(matchedTags)).slice(0, 3).join(", ")}`
                    : "Recommended for you",
        };
    });

    // 7. Deduplicate by igdbId, sort by score descending and return top N
    const uniqueGames = Array.from(new Map(scored.map(g => [g.igdbId, g])).values());

    return uniqueGames
        .filter((g) => g.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
