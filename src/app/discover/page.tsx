import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecommendations } from "@/lib/recommender";
import { prisma } from "@/lib/prisma";
import DiscoverClient from "./DiscoverClient";

export const metadata = {
    title: "Discover Games — QuestLog",
    description: "Search over 300,000 games. Explore trending titles and upcoming releases.",
};

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
    const session = await getServerSession(authOptions);

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

    let hasUser = false;

    if (session?.user?.email) {
        hasUser = true;
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (user) {
            recommendations = await getRecommendations(user.id, 12);
        }
    }

    return (
        <DiscoverClient
            recommendations={JSON.parse(JSON.stringify(recommendations))}
            hasUser={hasUser}
        />
    );
}
