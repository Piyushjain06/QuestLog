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
                        description: finalDescription || game.description,
                        genres: JSON.stringify(igdbGame.genres) || game.genres,
                        platforms: JSON.stringify(finalPlatforms),
                        developer: igdbGame.developers[0] || game.developer || null,
                        publisher: igdbGame.publishers[0] || game.publisher || null,
                        releaseDate: igdbGame.releaseDate || game.releaseDate,
                    },
                });
            } else {
                // Create new game from IGDB data
                game = await prisma.game.create({
                    data: {
                        title: igdbGame.title,
                        slug,
                        description: finalDescription,
                        coverUrl: igdbGame.coverUrl,
                        igdbId: String(igdbId),
                        genres: JSON.stringify(igdbGame.genres),
                        tags: JSON.stringify([]),
                        platforms: JSON.stringify(finalPlatforms),
                        developer: igdbGame.developers[0] || null,
                        publisher: igdbGame.publishers[0] || null,
                        releaseDate: igdbGame.releaseDate,
                        rating: igdbGame.rating ? parseFloat(igdbGame.rating) || null : null,
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
        console.error("IGDB import failed:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
