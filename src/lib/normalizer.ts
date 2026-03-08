import { prisma } from "./prisma";
import { slugify } from "./utils";

interface GameInput {
    title: string;
    description?: string;
    coverUrl?: string;
    steamAppId?: string;
    epicId?: string;
    genres?: string[];
    tags?: string[];
    platforms?: string[];
    developer?: string;
    publisher?: string;
    releaseDate?: string;
    rating?: number | null;
}

/**
 * Normalizes and upserts games into the database.
 * Deduplicates by steamAppId, epicId, or fuzzy title match.
 */
export async function normalizeAndUpsertGames(games: GameInput[]) {
    const results = [];

    for (const game of games) {
        // 1. Check if game already exists by platform ID
        let existing = null;

        if (game.steamAppId) {
            existing = await prisma.game.findUnique({ where: { steamAppId: game.steamAppId } });
        }

        if (!existing && game.epicId) {
            existing = await prisma.game.findUnique({ where: { epicId: game.epicId } });
        }

        // 2. Fuzzy match by slug
        if (!existing) {
            const slug = slugify(game.title);
            existing = await prisma.game.findUnique({ where: { slug } });
        }

        if (existing) {
            // Update with any new data (fill in blanks, don't overwrite)
            const updateData: Record<string, unknown> = {};
            if (game.steamAppId && !existing.steamAppId) updateData.steamAppId = game.steamAppId;
            if (game.epicId && !existing.epicId) updateData.epicId = game.epicId;
            if (game.coverUrl && !existing.coverUrl) updateData.coverUrl = game.coverUrl;
            if (game.description && !existing.description) updateData.description = game.description;

            if (Object.keys(updateData).length > 0) {
                await prisma.game.update({ where: { id: existing.id }, data: updateData });
            }

            results.push(existing);
        } else {
            // Create new game
            const created = await prisma.game.create({
                data: {
                    title: game.title,
                    slug: slugify(game.title),
                    description: game.description ?? "",
                    coverUrl: game.coverUrl ?? "",
                    steamAppId: game.steamAppId ?? null,
                    epicId: game.epicId ?? null,
                    genres: {
                        create: (game.genres ?? []).map((name) => ({
                            genre: { connectOrCreate: { where: { name }, create: { name } } },
                        })),
                    },
                    platforms: {
                        create: (game.platforms ?? []).map((name) => ({
                            platform: { connectOrCreate: { where: { name }, create: { name } } },
                        })),
                    },
                    developer: game.developer ?? null,
                    publisher: game.publisher ?? null,
                    releaseDate: game.releaseDate ?? null,
                    rating: game.rating ?? null,
                },
            });
            results.push(created);
        }
    }

    return results;
}

/**
 * Links imported games to a user's library
 */
export async function linkGamesToUser(
    userId: string,
    gameIds: string[],
    playtimeMap?: Record<string, number>
) {
    const results = [];

    for (const gameId of gameIds) {
        const existing = await prisma.userGameLibrary.findUnique({
            where: { userId_gameId: { userId, gameId } },
        });

        if (!existing) {
            const entry = await prisma.userGameLibrary.create({
                data: {
                    userId,
                    gameId,
                    playtimeHrs: playtimeMap?.[gameId] ?? 0,
                    status: "BACKLOG",
                },
            });
            results.push(entry);
        } else if (playtimeMap?.[gameId]) {
            // Update playtime if newer
            const updated = await prisma.userGameLibrary.update({
                where: { userId_gameId: { userId, gameId } },
                data: { playtimeHrs: playtimeMap[gameId] },
            });
            results.push(updated);
        } else {
            results.push(existing);
        }
    }

    return results;
}
