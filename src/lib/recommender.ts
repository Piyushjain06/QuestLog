import { prisma } from "./prisma";
import { getRecommendedGames, getTrendingGames } from "./igdb";
import type { NormalizedGame } from "./igdb";

interface LibraryEntry {
    status: string;
    favorite: boolean;
    userRating: number | null;
    game: {
        igdbId: bigint | number | null;
        genres: Array<{ genre: { name: string } }>;
    };
}

interface TagWeight {
    weight: number;
    original: string;
}

/**
 * Genre/tag names that describe a *publishing model* rather than gameplay.
 * Excluding them prevents "Indie" from dominating the profile and keeps
 * recommendations biased toward actual gameplay characteristics.
 */
const EXCLUDED_GENRE_TAGS = new Set([
    "indie",
    "indie game",
]);

/**
 * Build a weighted genre frequency map from the user's library.
 * Completed / playing / favourited / highly-rated games get higher weight.
 */
function buildGenreProfile(userLibrary: LibraryEntry[]): Map<string, TagWeight> {
    const profile = new Map<string, TagWeight>();

    for (const entry of userLibrary) {
        let weight = 1;
        if (entry.status === "COMPLETED") weight = 2;
        else if (entry.status === "PLAYING") weight = 1.5;
        else if (entry.status === "DROPPED") weight = 0.3;

        if (entry.favorite) weight *= 1.5;

        if (entry.userRating != null && entry.userRating > 0) {
            weight *= 0.5 + (entry.userRating / 10) * 1.5;
        }

        for (const g of entry.game.genres ?? []) {
            const name = g.genre.name;
            if (!name) continue;
            const key = name.toLowerCase().trim();
            // Skip meta-tags that describe publishing model rather than gameplay;
            // keeping "indie" inflates its weight and pushes popular games out.
            if (EXCLUDED_GENRE_TAGS.has(key)) continue;
            const existing = profile.get(key);
            if (existing) {
                existing.weight += weight;
            } else {
                profile.set(key, { weight, original: name });
            }
        }
    }

    return profile;
}

/** Return the top-N entries from a weight map, sorted descending. */
function topEntries(
    map: Map<string, TagWeight>,
    n: number
): Array<{ normalized: string; original: string; weight: number }> {
    return Array.from(map.entries())
        .map(([normalized, { weight, original }]) => ({ normalized, original, weight }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, n);
}

/**
 * IGDB-powered content-based recommendation engine.
 *
 * Builds a genre preference profile from the user's library (genres are stored in DB).
 * Passes those genre names to IGDB for matching against BOTH genres AND themes,
 * so a user who loves "Action" games will also get results that have "Action" as a theme.
 *
 * Candidates are then re-scored locally:
 *   - Genre match  → higher weight (primary signal)
 *   - Theme match  → lower weight  (secondary/contextual signal)
 */
export async function getRecommendations(
    userId: string,
    limit: number = 30,
    additionalExcludeIds: number[] = []
): Promise<Array<NormalizedGame & { score: number; reason: string }>> {
    // 1. Fetch user library with genre relations
    const userLibrary = await prisma.userGameLibrary.findMany({
        where: { userId },
        include: {
            game: {
                include: {
                    genres: { include: { genre: true } },
                },
            },
        },
    }) as unknown as LibraryEntry[];

    if (userLibrary.length === 0) return [];

    // 2. Build weighted genre profile
    const genreProfile = buildGenreProfile(userLibrary);
    if (genreProfile.size === 0) return [];

    // 3. Extract top genre names for the IGDB query
    //    Split into primary (top 5) and secondary (next 5) for the dual-match strategy
    const allTopGenres = topEntries(genreProfile, 10);
    const primaryGenres = allTopGenres.slice(0, 5).map((t) => t.original);
    const secondaryGenres = allTopGenres.slice(5).map((t) => t.original);

    // 4. Collect already-owned IGDB IDs to exclude
    const excludeIgdbIds: number[] = [...additionalExcludeIds];
    for (const entry of userLibrary) {
        if (entry.game?.igdbId) excludeIgdbIds.push(Number(entry.game.igdbId));
    }

    // 5. Query IGDB with dual genre+theme matching:
    //    - genreNames = user's top genres  → matched against IGDB genres field
    //    - themeNames = user's top genres  → also matched against IGDB themes field
    //    This surfaces games that share themes with genres the user loves
    //    (e.g., "Action" genre lovers also get "Action" themed games)
    const candidates = await getRecommendedGames(
        primaryGenres,
        excludeIgdbIds,
        limit * 4,
        [...primaryGenres, ...secondaryGenres] // use genre names as theme search terms too
    );

    if (candidates.length === 0) {
        // Fallback: trending games
        const trending = await getTrendingGames(limit);
        return trending.map((game) => ({
            ...game,
            score: 0,
            reason: "Trending right now",
        }));
    }

    // 6. Re-score each candidate against the genre profile
    //    Genres on the IGDB game → match against genre profile (primary, 1.2× boost)
    //    Themes on the IGDB game → match against genre profile (secondary, 0.8× weight)
    const scored = candidates.map((game) => {
        const gameGenres = game.genres.map((g) => g.toLowerCase().trim());
        const gameThemes = (game.themes ?? []).map((t) => t.toLowerCase().trim());

        let score = 0;
        const matchedGenres: string[] = [];
        const matchedThemes: string[] = [];

        for (const g of gameGenres) {
            const entry = genreProfile.get(g);
            if (entry) {
                score += entry.weight * 1.2;
                matchedGenres.push(entry.original);
            }
        }

        for (const t of gameThemes) {
            const entry = genreProfile.get(t);
            if (entry) {
                score += entry.weight * 0.8;
                matchedThemes.push(entry.original);
            }
        }

        // Normalize to avoid bias toward games with many tags
        const totalTags = gameGenres.length + gameThemes.length;
        const normalizedScore = totalTags > 0 ? score / Math.sqrt(totalTags) : 0;

        // IGDB community-rating bonus
        const rating = typeof game.rating === "number"
            ? game.rating
            : game.rating ? parseFloat(game.rating) : 0;
        const ratingBoost = rating / 100;

        // Build human-readable reason
        let reason = "Recommended for you";
        const uniqueGenres = Array.from(new Set(matchedGenres)).slice(0, 3);
        const uniqueThemes = Array.from(new Set(matchedThemes)).slice(0, 2);

        if (uniqueGenres.length > 0 && uniqueThemes.length > 0) {
            reason = `Genres: ${uniqueGenres.join(", ")} · Themes: ${uniqueThemes.join(", ")}`;
        } else if (uniqueGenres.length > 0) {
            reason = `Matches: ${uniqueGenres.join(", ")}`;
        } else if (uniqueThemes.length > 0) {
            reason = `Themes: ${uniqueThemes.join(", ")}`;
        }

        return {
            ...game,
            score: normalizedScore + ratingBoost,
            reason,
        };
    });

    // 7. Deduplicate, sort by score, return top N
    const uniqueGames = Array.from(new Map(scored.map((g) => [g.igdbId, g])).values());

    return uniqueGames
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
