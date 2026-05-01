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
            const searchResult = await searchGames(game.title, 5);
            if (searchResult.games.length > 0) {
                // To prevent aggressive false matches (like linking to a Bundle), only backfill if there's an exact title match
                const exactMatch = searchResult.games.find((g: any) => g.title.toLowerCase() === game.title.toLowerCase());
                
                if (exactMatch) {
                    game = await prisma.game.update({
                        where: { id: game.id },
                        data: { igdbId: String(exactMatch.igdbId) },
                        include: {
                            missions: { orderBy: { orderIndex: "asc" } },
                            library: true,
                            genres: { include: { genre: true } },
                            platforms: { include: { platform: true } },
                        },
                    });
                }
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
    let userSteamId: string | null = null;
    let userId: string | null = null;

    if (session?.user?.email) {
        isLoggedIn = true;
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
            userId = user.id;
            userSteamId = user.steamId;
            const [details, library] = await Promise.all([
                prisma.userGameDetails.findUnique({
                    where: { userId_gameId: { userId: user.id, gameId: game.id } }
                }),
                prisma.userGameLibrary.findUnique({
                    where: { userId_gameId: { userId: user.id, gameId: game.id } },
                })
            ]);
            if (game.missions && game.missions.length > 0) {
                const progressArr = await prisma.userMissionProgress.findMany({
                    where: {
                        userId: user.id,
                        missionId: { in: game.missions.map((m: any) => m.id) }
                    }
                });
                for (const p of progressArr) {
                    missionProgress[p.missionId] = p.completed;
                }
            }

            libraryEntry = library;
        }
    }

    const missionsWithProgress = game.missions?.map((m: any) => ({
        ...m,
        completed: missionProgress[m.id] ?? false,
    })) || [];

    // Fetch achievements
    const achievements = await prisma.achievement.findMany({
        where: { gameId: game.id },
        orderBy: { name: "asc" }
    });

    let userMap = new Map<string, Date>();
    if (userId && userSteamId && achievements.length > 0) {
        const unlocked = await prisma.userAchievement.findMany({
            where: { 
                userId, 
                achievement: {
                    gameId: game.id 
                }
            }
        });
        unlocked.forEach((ua: any) => userMap.set(ua.achievementId, ua.unlockedAt));
    }
    
    const achievementsWithProgress = achievements.map((ach: any) => ({
        id: ach.id,
        name: ach.name,
        displayName: ach.displayName,
        description: ach.description,
        iconUrl: ach.iconUrl,
        iconGrayUrl: ach.iconGrayUrl,
        hidden: ach.hidden,
        unlockedAt: userMap.get(ach.id) || null,
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
            achievements={JSON.parse(JSON.stringify(achievementsWithProgress))}
            libraryEntry={libraryEntry ? JSON.parse(JSON.stringify(libraryEntry)) : null}
            isLoggedIn={isLoggedIn}
            similarGames={[]} // Initially empty, handled by client
            extendedDetails={undefined} // Handled by client
        />
    );
}
