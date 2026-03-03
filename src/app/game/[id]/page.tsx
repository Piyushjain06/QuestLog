import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSimilarGames } from "@/lib/recommender";
import { getGameById, getSimilarGamesFromIGDB } from "@/lib/igdb";
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
    let game = await prisma.game.findUnique({
        where: { id: params.id },
        include: {
            missions: { orderBy: { orderIndex: "asc" } },
            userLibraries: true,
        },
    });

    if (!game) notFound();

    // Lazy backfill: if game has an IGDB ID but no tags, fetch themes from IGDB
    const currentTags = (() => { try { return JSON.parse(game.tags); } catch { return []; } })();
    if (game.igdbId && currentTags.length === 0) {
        try {
            const igdbGame = await getGameById(Number(game.igdbId));
            if (igdbGame && igdbGame.themes.length > 0) {
                game = await prisma.game.update({
                    where: { id: game.id },
                    data: { tags: JSON.stringify(igdbGame.themes) },
                    include: {
                        missions: { orderBy: { orderIndex: "asc" } },
                        userLibraries: true,
                    },
                }) as typeof game;
            }
        } catch (e) {
            console.warn("Failed to backfill themes for", game.title, e);
        }
    }

    // Fetch similar games from IGDB API (or fallback to local DB)
    const similarGamesPromise = game.igdbId
        ? getSimilarGamesFromIGDB(Number(game.igdbId), 5)
        : getSimilarGames(game.id, 5);

    const session = await getServerSession(authOptions);
    let missionProgress: Record<string, boolean> = {};
    let libraryEntry = null;
    let isLoggedIn = false;

    if (session?.user?.email) {
        isLoggedIn = true;
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
            const progress = await prisma.userMissionProgress.findMany({
                where: { userId: user.id, mission: { gameId: game.id } },
            });
            missionProgress = Object.fromEntries(progress.map((p) => [p.missionId, p.completed]));

            libraryEntry = await prisma.userGameLibrary.findUnique({
                where: { userId_gameId: { userId: user.id, gameId: game.id } },
            });
        }
    }

    const [similarGames, missionsWithProgress] = await Promise.all([
        similarGamesPromise,
        Promise.resolve(game.missions.map((m) => ({
            ...m,
            completed: missionProgress[m.id] ?? false,
        }))),
    ]);

    return (
        <GameDetailClient
            game={JSON.parse(JSON.stringify(game))}
            missions={JSON.parse(JSON.stringify(missionsWithProgress))}
            libraryEntry={libraryEntry ? JSON.parse(JSON.stringify(libraryEntry)) : null}
            isLoggedIn={isLoggedIn}
            similarGames={JSON.parse(JSON.stringify(similarGames))}
        />
    );
}


