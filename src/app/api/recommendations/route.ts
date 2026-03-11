import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecommendations } from "@/lib/recommender";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse excluded IDs from query param (comma-separated igdbIds to skip)
    const excludeParam = req.nextUrl.searchParams.get("exclude") ?? "";
    const excludeIds: number[] = excludeParam
        ? excludeParam.split(",").map(Number).filter((n) => !isNaN(n))
        : [];

    const recommendations = await getRecommendations(user.id, 12, excludeIds);

    return NextResponse.json({ recommendations });
}
