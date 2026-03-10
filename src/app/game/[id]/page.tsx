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

    // We use the database game data primarily to populate the initial UI instantly.
    // The GameDetailClient component will fetch "live" IGDB data (ratings, similar games, etc.)
    // asynchronously in the background so the user isn't forced to wait for IGDB to respond.

    const session = await getServerSession(authOptions);
    let missionProgress: Record<string, boolean> = {};
    let libraryEntry = null;
    let isLoggedIn = false;

    if (session?.user?.email) {
        isLoggedIn = true;
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
            const [details, library] = await Promise.all([
                prisma.userGameDetails.findUnique({
                    where: { userId_gameId: { userId: user.id, gameId: game.id } }
                }),
                prisma.userGameLibrary.findUnique({
                    where: { userId_gameId: { userId: user.id, gameId: game.id } },
                })
            ]);
            missionProgress = (details?.missionProgress as Record<string, boolean>) || {};
            libraryEntry = library;
        }
    }

    const missionsWithProgress = game.missions.map((m: any) => ({
        ...m,
        completed: missionProgress[m.id] ?? false,
    }));

    const gameProps = {
        ...game,
        description: game.description || "",
        coverUrl: game.coverUrl || "",
        genres: JSON.stringify(game.genres?.map((g: any) => g.genre.name) || []),
        platforms: JSON.stringify(game.platforms?.map((p: any) => p.platform.name) || []),
        tags: JSON.stringify([]), // Will be populated by live data on the client
    };

    return (
        <GameDetailClient
            game={JSON.parse(JSON.stringify(gameProps))}
            missions={JSON.parse(JSON.stringify(missionsWithProgress))}
            libraryEntry={libraryEntry ? JSON.parse(JSON.stringify(libraryEntry)) : null}
            isLoggedIn={isLoggedIn}
            similarGames={[]} // Initially empty, handled by client
            extendedDetails={undefined} // Handled by client
        />
    );
}
