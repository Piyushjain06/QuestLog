import { NextResponse } from "next/server";
import { getTrendingGames, getMostAnticipatedGames, getComingSoonGames, getRecommendedGames } from "@/lib/igdb";

export async function GET() {
    try {
        const trending = await getTrendingGames(3);
        const anticipated = await getMostAnticipatedGames(3);
        const comingSoon = await getComingSoonGames(3);
        const recommended = await getRecommendedGames(["RPG", "Adventure"], [], 3);
        return NextResponse.json({
            trending,
            anticipated,
            comingSoon,
            recommended
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack });
    }
}
