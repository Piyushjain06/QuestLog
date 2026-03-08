import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH — toggle mission completion
export async function PATCH(req: NextRequest) {
    try {
        const { missionId, completed } = await req.json();

        const user = await prisma.user.findFirst();
        if (!user) {
            return NextResponse.json({ error: "No user found" }, { status: 401 });
        }

        const gameId = await prisma.mission.findUnique({
            where: { id: missionId },
            select: { gameId: true }
        });

        if (!gameId) {
            return NextResponse.json({ error: "Mission not found" }, { status: 404 });
        }

        const details = await prisma.userGameDetails.upsert({
            where: { userId_gameId: { userId: user.id, gameId: gameId.gameId } },
            update: {},
            create: { userId: user.id, gameId: gameId.gameId },
        });

        const updatedProgress = {
            ...(details.missionProgress as Record<string, boolean>),
            [missionId]: completed,
        };

        await prisma.userGameDetails.update({
            where: { userId_gameId: { userId: user.id, gameId: gameId.gameId } },
            data: { missionProgress: updatedProgress }
        });

        return NextResponse.json({ success: true, missionProgress: updatedProgress });
    } catch (error) {
        console.error("Failed to update mission:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
