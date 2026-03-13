import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchSteamAppIdFromIGDB, cacheGlobalAchievements, fetchUserAchievements } from "@/lib/steamTracker";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.steamId)) {
            return NextResponse.json({ error: "Steam account not linked" }, { status: 400 });
        }

        const game = await prisma.game.findUnique({
            where: { id: params.id }
        });

        if (!game) {
            return NextResponse.json({ error: "Game not found" }, { status: 404 });
        }

        // Try to fetch Steam app ID if we don't have one
        let steamAppId = game.steamAppId;
        if (!steamAppId && game.igdbId) {
            steamAppId = await fetchSteamAppIdFromIGDB(game.igdbId);
        }

        if (!steamAppId) {
            return NextResponse.json({ error: "Game not found on Steam" }, { status: 404 });
        }

        // 1. Ensure globals are cached
        await cacheGlobalAchievements(game.id, steamAppId);

        // 2. Fetch user's achievements
        if (user.steamId) {
            await fetchUserAchievements(user.id, user.steamId, game.id, steamAppId);
        }

        return NextResponse.json({ success: true, steamAppId });
    } catch (error: any) {
        console.error("Steam sync error:", error);
        return NextResponse.json({ error: error.message || "Failed to sync achievements" }, { status: 500 });
    }
}
