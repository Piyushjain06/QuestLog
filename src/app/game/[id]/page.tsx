import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGameById, getSimilarGamesFromIGDB, getExtendedGameDetailsFromIGDB, searchGames } from "@/lib/igdb";
import { GameDetailClient } from "./GameDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
    const game = await prisma.game.findUnique({ where: { id: params.id } });
    return {
        title: game ? `${game.title} — QuestLog` : "Game Not Found",
        description: game?.description ?? "Game details",
    };
}

export default async function GameDetailPage({ params }: { params: { id: string } }) {
    let dbGame = await prisma.game.findUnique({
        where: { id: params.id },
        include: {
            missions: { orderBy: { orderIndex: "asc" } },
            library: true,
            genres: { include: { genre: true } },
            platforms: { include: { platform: true } },
        },
    });

    if (!dbGame) notFound();
    let game: any = dbGame;

    // Lazy backfill igdbId if missing (for legacy games imported before IGDB migration)
    if (!game.igdbId) {
        try {
            const searchResult = await searchGames(game.title, 1);
            if (searchResult.games.length > 0) {
                const bestMatch = searchResult.games[0];
                game = await prisma.game.update({
                    where: { id: game.id },
                    data: { igdbId: String(bestMatch.igdbId) },
                    include: {
                        missions: { orderBy: { orderIndex: "asc" } },
                        library: true,
                        genres: { include: { genre: true } },
                        platforms: { include: { platform: true } },
                    },
                });
            }
        } catch (e) {
            console.warn("Failed to backfill igdbId for legacy game", game.title, e);
        }
    }

    // Fetch full data from IGDB if igdbId is present to backfill minimal DB data
    if (game.igdbId) {
        try {
            const igdbGame = await getGameById(Number(game.igdbId));
            if (igdbGame) {
                // Merge live IGDB data with the game object
                // We're dropping local write-backs of live IGDB metadata to adhere strictly
                // to the minimalist db architecture. The UI will just use the live igdbGame values.
                game.liveDescription = igdbGame.description;
                game.liveCoverUrl = igdbGame.coverUrl;
                game.liveGenres = JSON.stringify(igdbGame.genres);
                game.liveTags = JSON.stringify(igdbGame.themes);
                game.livePlatforms = JSON.stringify(igdbGame.platforms);

                game.developer = game.developer || igdbGame.developers[0] || null;
                game.publisher = game.publisher || igdbGame.publishers[0] || null;
                game.releaseDate = game.releaseDate || igdbGame.releaseDate;
                if (!game.rating && igdbGame.rating) {
                    game.rating = parseFloat(igdbGame.rating);
                }
            }
        } catch (e) {
            console.warn("Failed to fetch full IGDB details for", game.title, e);
        }
    }

    const similarGamesPromise = game.igdbId
        ? getSimilarGamesFromIGDB(Number(game.igdbId), 5)
        : Promise.resolve([]);

    const extendedDetailsPromise = game.igdbId
        ? getExtendedGameDetailsFromIGDB(Number(game.igdbId))
        : Promise.resolve({ releases: [], websites: [], timeToBeat: null });

    const session = await getServerSession(authOptions);
    let missionProgress: Record<string, boolean> = {};
    let libraryEntry = null;
    let isLoggedIn = false;

    if (session?.user?.email) {
        isLoggedIn = true;
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
            const details = await prisma.userGameDetails.findUnique({
                where: { userId_gameId: { userId: user.id, gameId: game.id } }
            });
            const rawProgress = details?.missionProgress as Record<string, boolean> || {};
            missionProgress = { ...rawProgress };

            libraryEntry = await prisma.userGameLibrary.findUnique({
                where: { userId_gameId: { userId: user.id, gameId: game.id } },
            });
        }
    }

    const [similarGames, extendedDetails, missionsWithProgress] = await Promise.all([
        similarGamesPromise,
        extendedDetailsPromise,
        Promise.resolve(game.missions.map((m: any) => ({
            ...m,
            completed: missionProgress[m.id] ?? false,
        }))),
    ]);

    const gameProps = {
        ...game,
        description: game.liveDescription || game.description,
        coverUrl: game.liveCoverUrl || game.coverUrl,
        genres: game.liveGenres || JSON.stringify(game.genres?.map((g: any) => g.genre.name) || []),
        platforms: game.livePlatforms || JSON.stringify(game.platforms?.map((p: any) => p.platform.name) || []),
        tags: game.liveTags || JSON.stringify([]),
    };

    return (
        <GameDetailClient
            game={JSON.parse(JSON.stringify(gameProps))}
            missions={JSON.parse(JSON.stringify(missionsWithProgress))}
            libraryEntry={libraryEntry ? JSON.parse(JSON.stringify(libraryEntry)) : null}
            isLoggedIn={isLoggedIn}
            similarGames={JSON.parse(JSON.stringify(similarGames))}
            extendedDetails={JSON.parse(JSON.stringify(extendedDetails))}
        />
    );
}


