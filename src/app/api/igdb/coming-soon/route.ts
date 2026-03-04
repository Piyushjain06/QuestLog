import { NextResponse } from "next/server";
import { getComingSoonGames } from "@/lib/igdb";

export async function GET() {
    try {
        const games = await getComingSoonGames(12);
        return NextResponse.json({ games });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch coming soon games";
        console.error("Coming soon games error:", message);
        return NextResponse.json({ error: message, games: [] }, { status: 500 });
    }
}
