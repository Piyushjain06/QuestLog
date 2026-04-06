import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTrendingGames, getMostAnticipatedGames, getComingSoonGames, getRecommendedGames } from "@/lib/igdb";

export async function GET() {
    // This endpoint is only available in development
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const trending = await getTrendingGames(3);
        const anticipated = await getMostAnticipatedGames(3);
        const comingSoon = await getComingSoonGames(3);
        const recommended = await getRecommendedGames(["RPG", "Adventure"], [], 3);
        return NextResponse.json({ trending, anticipated, comingSoon, recommended });
    } catch (e: any) {
        // Log the stack server-side but never send it to the client
        console.error("[igdb/debug]", e);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
