import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecommendClient } from "./RecommendClient";
import { getRecommendations } from "@/lib/recommender";
import { getTrendingGames } from "@/lib/igdb";
import { prisma } from "@/lib/prisma";

export const metadata = {
    title: "For You — QuestLog",
    description: "AI-powered game recommendations based on your library and playstyle.",
};

export const dynamic = "force-dynamic";

export default async function RecommendPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/auth");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    let recommendations: Array<{
        igdbId: number;
        title: string;
        coverUrl: string;
        description: string;
        releaseDate: string | null;
        rating: string | null;
        genres: string[];
        themes: string[];
        developers: string[];
        publishers: string[];
        platforms: string[];
        score: number;
        reason: string;
    }> = [];

    if (user) {
        recommendations = await getRecommendations(user.id, 12);
    }

    // Get trending games from IGDB for the "Top Rated" section
    const trendingGames = await getTrendingGames(12);

    return (
        <RecommendClient
            recommendations={JSON.parse(JSON.stringify(recommendations))}
            trendingGames={JSON.parse(JSON.stringify(trendingGames))}
            hasUser={!!user}
        />
    );
}
