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

        const progress = await prisma.userMissionProgress.upsert({
            where: { userId_missionId: { userId: user.id, missionId } },
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

        return NextResponse.json(progress);
    } catch (error) {
        console.error("Failed to update mission:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
