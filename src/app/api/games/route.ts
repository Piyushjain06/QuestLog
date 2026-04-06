import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const VALID_STATUSES = ["PLAYING", "COMPLETED", "DROPPED", "BACKLOG", "PLANNING"] as const;

// PATCH — update game library entry (status and/or playtime)
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { gameId, status, playtimeHrs, favorite, userRating } = await req.json();

        // ── Input validation ───────────────────────────────────────────────
        if (!gameId || typeof gameId !== "string") {
            return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
        }
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
                { status: 400 }
            );
        }
        if (playtimeHrs !== undefined) {
            const hrs = Number(playtimeHrs);
            if (isNaN(hrs) || !isFinite(hrs) || hrs < 0 || hrs > 100_000) {
                return NextResponse.json({ error: "playtimeHrs must be a number between 0 and 100,000" }, { status: 400 });
            }
        }
        if (userRating !== undefined && userRating !== null) {
            const r = Number(userRating);
            if (isNaN(r) || r < 0 || r > 10) {
                return NextResponse.json({ error: "userRating must be between 0 and 10" }, { status: 400 });
            }
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

// GET — list games (authenticated, paginated to prevent full-table dumps)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { searchParams } = req.nextUrl;
        const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

        const games = await prisma.game.findMany({
            orderBy: { title: "asc" },
            take: limit,
            skip: page * limit,
            select: {
                id: true,
                title: true,
                slug: true,
                coverUrl: true,
                rating: true,
                releaseDate: true,
                igdbId: true,
                steamAppId: true,
            },
        });

        return NextResponse.json(games);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 });
    }
}

// DELETE — remove game from user's library
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { gameId } = await req.json();

        if (!gameId || typeof gameId !== "string") {
            return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
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
