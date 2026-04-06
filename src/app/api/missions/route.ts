import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH — toggle mission completion
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        const body = await req.json();
        const { missionId, completed } = body;

        if (!missionId || typeof missionId !== "string") {
            return NextResponse.json({ error: "Invalid missionId" }, { status: 400 });
        }
        if (typeof completed !== "boolean") {
            return NextResponse.json({ error: "completed must be a boolean" }, { status: 400 });
        }

        const mission = await prisma.mission.findUnique({
            where: { id: missionId },
            select: { gameId: true },
        });

        if (!mission) {
            return NextResponse.json({ error: "Mission not found" }, { status: 404 });
        }

        // Verify the user has this game in their library before allowing progress updates
        const inLibrary = await prisma.userGameLibrary.findUnique({
            where: { userId_gameId: { userId: user.id, gameId: mission.gameId } },
            select: { userId: true },
        });
        if (!inLibrary) {
            return NextResponse.json({ error: "Game not in your library" }, { status: 403 });
        }

        await prisma.userMissionProgress.upsert({
            where: {
                userId_missionId: {
                    userId: user.id,
                    missionId,
                },
            },
            update: {
                completed,
                completedAt: completed ? new Date() : null,
            },
            create: {
                userId: user.id,
                missionId,
                completed,
                completedAt: completed ? new Date() : null,
            },
        });

        return NextResponse.json({ success: true, missionId, completed });
    } catch (error) {
        console.error("Failed to update mission:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
