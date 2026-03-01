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
 * Content-based recommendation engine.
 * Uses tag/genre similarity via cosine similarity of tag vectors.
 */
export async function getRecommendations(
    userId: string,
    limit: number = 10
): Promise<Array<GameVector & { score: number; reason: string }>> {
    // 1. Get user's games with their tags
    const userLibrary = await prisma.userGameLibrary.findMany({
        where: { userId },
        include: { game: true },
    });

    if (userLibrary.length === 0) return [];

    // 2. Build user's preference profile (aggregated tag/genre frequency)
    const tagFrequency: Record<string, number> = {};

    for (const entry of userLibrary) {
        const genres = parseJsonField<string[]>(entry.game.genres, []);
        const tags = parseJsonField<string[]>(entry.game.tags, []);
        const weight = entry.status === "COMPLETED" ? 2 : entry.status === "PLAYING" ? 1.5 : 1;

        for (const tag of [...genres, ...tags]) {
            const normalized = tag.toLowerCase().trim();
            tagFrequency[normalized] = (tagFrequency[normalized] ?? 0) + weight;
        }
    }

    // 3. Get all games NOT in user's library
    const userGameIds = new Set(userLibrary.map((e) => e.gameId));
    const allGames = await prisma.game.findMany();
    const candidates = allGames.filter((g) => !userGameIds.has(g.id));

    // 4. Score each candidate game
    const scored = candidates.map((game) => {
        const genres = parseJsonField<string[]>(game.genres, []);
        const tags = parseJsonField<string[]>(game.tags, []);
        const allTags = [...genres, ...tags].map((t) => t.toLowerCase().trim());

        let score = 0;
        const matchedTags: string[] = [];

        for (const tag of allTags) {
            if (tagFrequency[tag]) {
                score += tagFrequency[tag];
                matchedTags.push(tag);
            }
        }

        // Normalize by number of tags to avoid bias toward games with many tags
        const normalizedScore = allTags.length > 0 ? score / Math.sqrt(allTags.length) : 0;

        return {
            id: game.id,
            title: game.title,
            coverUrl: game.coverUrl,
            genres,
            tags,
            score: normalizedScore,
            reason: matchedTags.length > 0
                ? `Matches: ${matchedTags.slice(0, 3).join(", ")}`
                : "Discover something new",
        };
    });

    // 5. Sort by score descending and return top N
    return scored
        .filter((g) => g.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Find similar games to a specific game
 */
export async function getSimilarGames(
    gameId: string,
    limit: number = 6
): Promise<Array<GameVector & { score: number }>> {
    const sourceGame = await prisma.game.findUnique({ where: { id: gameId } });
    if (!sourceGame) return [];

    const sourceGenres = parseJsonField<string[]>(sourceGame.genres, []);
    const sourceTags = parseJsonField<string[]>(sourceGame.tags, []);
    const sourceVector = [...sourceGenres, ...sourceTags].map((t) => t.toLowerCase().trim());

    const allGames = await prisma.game.findMany({
        where: { id: { not: gameId } },
    });

    const scored = allGames.map((game) => {
        const genres = parseJsonField<string[]>(game.genres, []);
        const tags = parseJsonField<string[]>(game.tags, []);
        const gameVector = [...genres, ...tags].map((t) => t.toLowerCase().trim());

        // Jaccard similarity
        const intersection = sourceVector.filter((t) => gameVector.includes(t));
        const union = new Set([...sourceVector, ...gameVector]);
        const score = union.size > 0 ? intersection.length / union.size : 0;

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
