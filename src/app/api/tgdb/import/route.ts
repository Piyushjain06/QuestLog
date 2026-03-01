import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGameById } from "@/lib/tgdb";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
    try {
        const { tgdbId, status, platforms: clientPlatforms, description: clientDescription } = await req.json();

        if (!tgdbId) {
            return NextResponse.json({ error: "tgdbId required" }, { status: 400 });
        }

        // Check if game already exists locally by TGDB ID
        let game = await prisma.game.findFirst({
            where: { tgdbId: String(tgdbId) },
        });

        if (!game) {
            // Fetch from TGDB API
            const tgdbGame = await getGameById(Number(tgdbId));
            if (!tgdbGame) {
                return NextResponse.json({ error: "Game not found on TGDB" }, { status: 404 });
            }

            // Use client-provided merged data if available (from deduped search results)
            const finalPlatforms = clientPlatforms && clientPlatforms.length > 0
                ? clientPlatforms
                : tgdbGame.platforms;
            const finalDescription = clientDescription || tgdbGame.description;

            // Check by slug too (might exist from seed or Steam import)
            const slug = slugify(tgdbGame.title);
            game = await prisma.game.findUnique({ where: { slug } });

            if (game) {
                // Link existing game to TGDB — always prefer fresh data
                game = await prisma.game.update({
                    where: { id: game.id },
                    data: {
                        tgdbId: String(tgdbId),
                        coverUrl: tgdbGame.coverUrl || game.coverUrl,
                        description: finalDescription || game.description,
                        genres: JSON.stringify(tgdbGame.genres) || game.genres,
                        platforms: JSON.stringify(finalPlatforms),
                        developer: tgdbGame.developers[0] || game.developer || null,
                        publisher: tgdbGame.publishers[0] || game.publisher || null,
                        releaseDate: tgdbGame.releaseDate || game.releaseDate,
                    },
                });
            } else {
                // Create new game from TGDB data
                game = await prisma.game.create({
                    data: {
                        title: tgdbGame.title,
                        slug,
                        description: finalDescription,
                        coverUrl: tgdbGame.coverUrl,
                        tgdbId: String(tgdbId),
                        genres: JSON.stringify(tgdbGame.genres),
                        tags: JSON.stringify([]),
                        platforms: JSON.stringify(finalPlatforms),
                        developer: tgdbGame.developers[0] || null,
                        publisher: tgdbGame.publishers[0] || null,
                        releaseDate: tgdbGame.releaseDate,
                        rating: tgdbGame.rating ? parseFloat(tgdbGame.rating) || null : null,
                    },
                });
            }
        } else if (clientPlatforms && clientPlatforms.length > 0) {
            // Game already exists but update platforms if client has richer data
            const existingPlatforms: string[] = JSON.parse(game.platforms || "[]");
            const merged = Array.from(new Set([...existingPlatforms, ...clientPlatforms]));
            if (merged.length > existingPlatforms.length) {
                game = await prisma.game.update({
                    where: { id: game.id },
                    data: {
                        platforms: JSON.stringify(merged),
                        ...(clientDescription && !game.description ? { description: clientDescription } : {}),
                    },
                });
            }
        }

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
        console.error("TGDB import failed:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
