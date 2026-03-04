import { NextResponse } from "next/server";
import { getTrendingGames } from "@/lib/igdb";

export async function GET() {
    try {
        const games = await getTrendingGames(12);
        return NextResponse.json({ games });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch trending games";
        console.error("Trending games error:", message);
        return NextResponse.json({ error: message, games: [] }, { status: 500 });
    }
}
