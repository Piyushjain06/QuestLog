import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseLegendaryExport, parseManualCsv } from "@/lib/epic";
import { normalizeAndUpsertGames, linkGamesToUser } from "@/lib/normalizer";

export async function POST(req: NextRequest) {
    try {
        const { data, format } = await req.json();

        if (!data) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        // Parse based on format
        const epicGames = format === "csv" ? parseManualCsv(data) : parseLegendaryExport(data);

        // Get or create user
        let user = await prisma.user.findFirst();
        if (!user) {
            user = await prisma.user.create({
                data: { name: "Epic User" },
            });
        }

        // Normalize and upsert
        const games = await normalizeAndUpsertGames(
            epicGames.map((g) => ({
                title: g.title,
                epicId: g.epicId,
                description: g.description,
                coverUrl: g.coverUrl,
                genres: g.genres,
                tags: g.tags,
                platforms: g.platforms,
            }))
        );

        await linkGamesToUser(
            user.id,
            games.map((g) => g.id)
        );

        return NextResponse.json({
            imported: games.length,
            message: `Successfully imported ${games.length} games from Epic`,
        });
    } catch (error) {
        console.error("Epic import failed:", error);
        return NextResponse.json(
            { error: "Epic import failed. Check file format." },
            { status: 500 }
        );
    }
}
