import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH — update game library entry (status and/or playtime)
export async function PATCH(req: NextRequest) {
    try {
        const { gameId, status, playtimeHrs, favorite, userRating } = await req.json();

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }


        const entry = await prisma.userGameLibrary.upsert({
            where: { userId_gameId: { userId: user.id, gameId } },
            update: {
                ...(status ? { status } : {}),
                ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
                ...(status === "PLAYING" ? { startedAt: new Date() } : {}),
                ...(playtimeHrs !== undefined ? { playtimeHrs: Number(playtimeHrs) } : {}),
                ...(favorite !== undefined ? { favorite: Boolean(favorite) } : {}),
                ...(userRating !== undefined ? { userRating: userRating === null ? null : Number(userRating) } : {}),
            },
            create: {
                userId: user.id,
                gameId,
                status: status || "BACKLOG",
                ...(playtimeHrs !== undefined ? { playtimeHrs: Number(playtimeHrs) } : {}),
                ...(favorite !== undefined ? { favorite: Boolean(favorite) } : {}),
                ...(userRating !== undefined ? { userRating: userRating === null ? null : Number(userRating) } : {}),
            },
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error("Failed to update game:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

// GET — list games
export async function GET() {
    try {
        const games = await prisma.game.findMany({
            orderBy: { title: "asc" },
        });
        return NextResponse.json(games);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }
}

// DELETE — remove game from user's library
export async function DELETE(req: NextRequest) {
    try {
        const { gameId } = await req.json();

        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 401 });
        }

        await prisma.userGameLibrary.delete({
            where: { userId_gameId: { userId: user.id, gameId } },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to remove from library:", error);
        return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
    }
}
