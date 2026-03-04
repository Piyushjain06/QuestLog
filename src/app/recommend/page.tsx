import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecommendClient } from "./RecommendClient";
import { getRecommendations } from "@/lib/recommender";

export const metadata = {
    title: "Discover Games — QuestLog",
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
        id: string;
        title: string;
        coverUrl: string | null;
        genres: string[];
        tags: string[];
        score: number;
        reason: string;
    }> = [];

    if (user) {
        recommendations = await getRecommendations(user.id, 12);
    }

    // Also get top-rated games for browsing
    const topGames = await prisma.game.findMany({
        where: { rating: { not: null } },
        orderBy: { rating: "desc" },
        take: 12,
    });

    return (
        <RecommendClient
            recommendations={JSON.parse(JSON.stringify(recommendations))}
            topGames={JSON.parse(JSON.stringify(topGames))}
            hasUser={!!user}
        />
    );
}
