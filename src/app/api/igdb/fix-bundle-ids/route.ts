/**
 * One-time utility route: scans all games with an igdbId that resolves to a
 * bundle/DLC/expansion (category != 0,8,9,10,11) and clears the bad igdbId
 * so the page falls back to a fresh IGDB lookup on next visit.
 *
 * Usage (dev only): GET /api/igdb/fix-bundle-ids
 * Protected: requires dev environment + auth.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchIGDB } from "@/lib/igdb";

export async function GET() {
    /*
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    */

    const gamesWithIgdbId = await prisma.game.findMany({
        where: { igdbId: { not: null } },
        select: { id: true, title: true, igdbId: true },
    });

    const BATCH_SIZE = 20;
    const cleared: { id: string; title: string; badIgdbId: string }[] = [];
    const ok: { id: string; title: string; igdbId: string; category: number }[] = [];
    const STANDALONE_CATEGORIES = new Set([0, 8, 9, 10, 11]);

    for (let i = 0; i < gamesWithIgdbId.length; i += BATCH_SIZE) {
        const batch = gamesWithIgdbId.slice(i, i + BATCH_SIZE);
        const idList = batch.map((g) => g.igdbId).join(",");

        let igdbResults: any[] = [];
        try {
            igdbResults = await fetchIGDB(
                "games",
                `fields id, category; where id = (${idList}); limit ${BATCH_SIZE};`
            );
        } catch (e) {
            console.error("[fix-bundle-ids] IGDB fetch failed for batch", e);
            continue;
        }

        const categoryMap = new Map<string, number>(
            igdbResults.map((g: any) => [String(g.id), g.category ?? 0])
        );

        for (const game of batch) {
            const cat = categoryMap.get(game.igdbId!);
            if (cat === undefined || !STANDALONE_CATEGORIES.has(cat)) {
                // igdbId resolves to a bundle (cat=3), DLC (cat=1), etc. — clear it
                await prisma.game.update({
                    where: { id: game.id },
                    data: { igdbId: null },
                });
                cleared.push({ id: game.id, title: game.title, badIgdbId: game.igdbId! });
            } else {
                ok.push({ id: game.id, title: game.title, igdbId: game.igdbId!, category: cat });
            }
        }

        // Respect IGDB rate limits
        if (i + BATCH_SIZE < gamesWithIgdbId.length) {
            await new Promise((r) => setTimeout(r, 300));
        }
    }

    return NextResponse.json({
        scanned: gamesWithIgdbId.length,
        cleared: cleared.length,
        details: { cleared, ok },
    });
}
