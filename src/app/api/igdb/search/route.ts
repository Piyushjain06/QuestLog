import { NextRequest, NextResponse } from "next/server";
import { searchGames } from "@/lib/igdb";
import { prisma } from "@/lib/prisma";

// Search the local Prisma DB as a fallback
async function searchLocalDB(query: string) {
    // Split query into words for flexible matching
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);

    const allGames = await prisma.game.findMany({
        orderBy: { title: "asc" },
        include: {
            genres: { include: { genre: true } },
            platforms: { include: { platform: true } },
        }
    });

    // Filter with case-insensitive matching — each word must appear in the title
    const filtered = allGames.filter((g) => {
        const lower = g.title.toLowerCase();
        return words.every((w) => lower.includes(w));
    });

    // Also include partial matches (any word matches) ranked lower
    const partial = allGames.filter((g) => {
        const lower = g.title.toLowerCase();
        return words.some((w) => lower.includes(w)) && !filtered.includes(g);
    });

    const combined = [...filtered, ...partial].slice(0, 30);

    return {
        games: combined.map((g: any) => ({
            igdbId: g.igdbId ? Number(g.igdbId) : -Math.abs(g.id.charCodeAt(0)),
            title: g.title,
            description: g.description || "",
            coverUrl: g.coverUrl || "",
            releaseDate: g.releaseDate || null,
            rating: g.rating ? String(g.rating) : null,
            genres: g.genres?.map((x: any) => x.genre.name) || [],
            developers: g.developer ? [g.developer] : [],
            publishers: g.publisher ? [g.publisher] : [],
            platforms: g.platforms?.map((x: any) => x.platform.name) || [],
            localId: g.id,
        })),
        count: combined.length,
        source: "local" as const,
    };
}

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10), 500);
    const genresParam = req.nextUrl.searchParams.get("genres") ?? "";
    const themesParam = req.nextUrl.searchParams.get("themes") ?? "";

    const genres = genresParam ? genresParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const themes = themesParam ? themesParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

    const query = q.trim();
    const hasFilters = genres.length > 0 || themes.length > 0;

    if (query.length === 0 && !hasFilters) {
        return NextResponse.json({ games: [], count: 0 });
    }

    let igdbUnavailable = false;
    let igdbError = "";

    // Try IGDB first
    try {
        const result = await searchGames(query, limit, offset, genres, themes);

        if (result.games.length > 0) {
            return NextResponse.json({ ...result, source: "igdb" });
        }
    } catch (error: unknown) {
        igdbUnavailable = true;
        igdbError = error instanceof Error ? error.message : "Unknown error";
        console.warn("IGDB search unavailable, falling back to local DB:", igdbError);
    }

    // Fallback: search local database
    try {
        const localResult = await searchLocalDB(query);
        return NextResponse.json({
            ...localResult,
            ...(igdbUnavailable && {
                warning: "Twitch IGDB API is temporarily unavailable. Showing results from your local library only.",
            }),
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Search failed";
        console.error("Local search also failed:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
