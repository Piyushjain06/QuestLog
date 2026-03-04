import { NextResponse } from "next/server";
import { getUpcomingGames } from "@/lib/igdb";

export async function GET() {
    try {
        const games = await getUpcomingGames(12);
        return NextResponse.json({ games });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch upcoming games";
        console.error("Upcoming games error:", message);
        return NextResponse.json({ error: message, games: [] }, { status: 500 });
    }
}
