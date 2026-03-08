import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGameById } from "@/lib/igdb";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
    try {
        const { igdbId, status, platforms: clientPlatforms, description: clientDescription } = await req.json();

        if (!igdbId) {
            return NextResponse.json({ error: "igdbId required" }, { status: 400 });
        }

        // Check if game already exists locally by IGDB ID
        let game = await prisma.game.findFirst({
            where: { igdbId: String(igdbId) },
        });

        if (!game) {
            // Fetch from IGDB API
            const igdbGame = await getGameById(Number(igdbId));
            if (!igdbGame) {
                return NextResponse.json({ error: "Game not found on IGDB" }, { status: 404 });
            }

            // Use client-provided merged data if available (from deduped search results)
            const finalPlatforms = clientPlatforms && clientPlatforms.length > 0
                ? clientPlatforms
                : igdbGame.platforms;
            const finalDescription = clientDescription || igdbGame.description;

            // Check by slug too (might exist from seed or Steam import)
            const slug = slugify(igdbGame.title);
            game = await prisma.game.findUnique({ where: { slug } });

            if (game) {
                // Link existing game to IGDB — always prefer fresh data
                game = await prisma.game.update({
                    where: { id: game.id },
                    data: {
                        igdbId: String(igdbId),
                        coverUrl: igdbGame.coverUrl || game.coverUrl,
                        platforms: {
                            deleteMany: {},
                            create: finalPlatforms.map((name: string) => ({
                                platform: { connectOrCreate: { where: { name }, create: { name } } }
                            }))
                        },
                    },
                });
            } else {
                // Create new game from IGDB data
                game = await prisma.game.create({
                    data: {
                        title: igdbGame.title,
                        slug,
                        coverUrl: igdbGame.coverUrl,
                        igdbId: String(igdbId),
                        platforms: {
                            create: finalPlatforms.map((name: string) => ({
                                platform: { connectOrCreate: { where: { name }, create: { name } } }
                            }))
                        },
                    },
                });
            }
        } // End of game creation / sync block

        // Only add to user's library if a status was explicitly provided
        if (status) {
            const user = await prisma.user.findFirst();
            if (user) {
                await prisma.userGameLibrary.upsert({
                    where: { userId_gameId: { userId: user.id, gameId: game.id } },
                    update: { status },
                    create: {
                        userId: user.id,
                        gameId: game.id,
                        status,
                    },
                });
            }
        }

        return NextResponse.json({
            success: true,
            game: { id: game.id, title: game.title, slug: game.slug },
            message: `"${game.title}" added to your library`,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Import failed";
        console.error("IGDB import failed:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
