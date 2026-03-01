import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importSteamLibrary } from "@/lib/steam";
import { normalizeAndUpsertGames, linkGamesToUser } from "@/lib/normalizer";

export async function POST(req: NextRequest) {
    try {
        const { steamId } = await req.json();

        if (!steamId) {
            return NextResponse.json({ error: "Steam ID required" }, { status: 400 });
        }

        // Get or create user
        let user = await prisma.user.findFirst({ where: { steamId } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    steamId,
                    name: `Steam User ${steamId.slice(-4)}`,
                },
            });
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
