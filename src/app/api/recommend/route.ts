import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRecommendations } from "@/lib/recommender";

export async function GET() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ recommendations: [] });
        }

        const recommendations = await getRecommendations(user.id, 12);
        return NextResponse.json({ recommendations });
    } catch (error) {
        console.error("Recommendation failed:", error);
        return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
    }
}
