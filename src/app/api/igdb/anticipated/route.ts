import { NextResponse } from "next/server";
import { getMostAnticipatedGames } from "@/lib/igdb";

export async function GET() {
    try {
        const games = await getMostAnticipatedGames(8);
        return NextResponse.json({ games });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch most anticipated games";
        console.error("Most anticipated games error:", message);
        return NextResponse.json({ error: message, games: [] }, { status: 500 });
    }
}
