import { NextResponse } from "next/server";
import { getGameById, getSimilarGamesFromIGDB, getExtendedGameDetailsFromIGDB } from "@/lib/igdb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const igdbIdStr = searchParams.get("igdbId");

    if (!igdbIdStr) return NextResponse.json({ error: "Missing igdbId" }, { status: 400 });
    const igdbId = Number(igdbIdStr);

    try {
        const [liveGame, similarGames, extendedDetails] = await Promise.all([
            getGameById(igdbId).catch(() => null),
            getSimilarGamesFromIGDB(igdbId, 5).catch(() => []),
            getExtendedGameDetailsFromIGDB(igdbId).catch(() => ({ releases: [], websites: [], timeToBeat: null }))
        ]);

        return NextResponse.json({ liveGame, similarGames, extendedDetails });
    } catch (e) {
        console.error("Failed to fetch live game details API", e);
        return NextResponse.json({ error: "Failed to fetch live data" }, { status: 500 });
    }
}
