import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { importSteamLibrary } from "@/lib/steam";
import { normalizeAndUpsertGames, linkGamesToUser } from "@/lib/normalizer";
import { steamImportLimiter } from "@/lib/rateLimiter";

export async function POST(req: NextRequest) {
    try {
        // ── Auth guard ──────────────────────────────────────────────────────
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rl = steamImportLimiter.check(session.user.email);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: "You can only import your Steam library 3 times every 5 minutes. Please wait." },
                { status: 429 }
            );
        }

        const { steamId } = await req.json();

        if (!steamId) {
            return NextResponse.json({ error: "Steam ID required" }, { status: 400 });
        }

        // Fetch the authenticated user and verify the steamId belongs to them
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, steamId: true },
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }
        if (user.steamId !== steamId) {
            return NextResponse.json({ error: "Forbidden: Steam ID does not match your account" }, { status: 403 });
        }

        // Fetch games from Steam
        const steamGames = await importSteamLibrary(steamId);

        // Normalize and upsert games
        const games = await normalizeAndUpsertGames(
            steamGames.map((g) => ({
                title: g.title,
                steamAppId: g.steamAppId,
                description: g.description,
                coverUrl: g.coverUrl,
                genres: g.genres,
                tags: g.tags,
                platforms: g.platforms,
                developer: g.developer,
                publisher: g.publisher,
                releaseDate: g.releaseDate,
                rating: g.rating,
            }))
        );

        // Link to user's library
        const playtimeMap: Record<string, number> = {};
        for (const sg of steamGames) {
            const game = games.find(
                (g) => g.steamAppId === sg.steamAppId
            );
            if (game) {
                playtimeMap[game.id] = sg.playtimeMinutes / 60;
            }
        }

        await linkGamesToUser(
            user.id,
            games.map((g) => g.id),
            playtimeMap
        );

        return NextResponse.json({
            imported: games.length,
            message: `Successfully imported ${games.length} games from Steam`,
        });
    } catch (error) {
        console.error("Steam import failed:", error);
        return NextResponse.json(
            { error: "Steam import failed. Check your API key and Steam ID." },
            { status: 500 }
        );
    }
}
