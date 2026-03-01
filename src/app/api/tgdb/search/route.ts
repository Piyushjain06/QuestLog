import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/tgdb";
import { prisma } from "@/lib/prisma";

// Search the local Prisma DB as a fallback
async function searchLocalDB(query: string) {
    const games = await prisma.game.findMany({
        where: {
            title: { contains: query },
        },
        take: 20,
        orderBy: { title: "asc" },
    });

    return {
        games: games.map((g) => ({
            tgdbId: g.tgdbId ? Number(g.tgdbId) : -Math.abs(g.id.charCodeAt(0)),
            title: g.title,
            description: g.description || "",
            coverUrl: g.coverUrl || "",
            releaseDate: g.releaseDate || null,
            rating: g.rating ? String(g.rating) : null,
            genres: (() => { try { return JSON.parse(g.genres); } catch { return []; } })(),
            developers: g.developer ? [g.developer] : [],
            publishers: g.publisher ? [g.publisher] : [],
            platforms: (() => { try { return JSON.parse(g.platforms); } catch { return []; } })(),
            localId: g.id,
        })),
        pages: { next: "", previous: "" },
        source: "local" as const,
    };
}

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q");
    const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10);

    if (!q || q.trim().length === 0) {
        return NextResponse.json({ games: [], pages: {} });
    }

    const query = q.trim();

    // Try TGDB first with a 5-second timeout
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const result = await searchGames(query, page);
        clearTimeout(timeoutId);

        if (result.games.length > 0) {
            return NextResponse.json({ ...result, source: "tgdb" });
        }
    } catch (error: unknown) {
        console.warn("TGDB search unavailable, falling back to local DB:",
            error instanceof Error ? error.message : "Unknown error");
    }

    // Fallback: search local database
    try {
        const localResult = await searchLocalDB(query);
        return NextResponse.json(localResult);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Search failed";
        console.error("Local search also failed:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
