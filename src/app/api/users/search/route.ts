import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userSearchLimiter } from "@/lib/rateLimiter";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = userSearchLimiter.check(session.user.email);
    if (!rl.allowed) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
        return NextResponse.json({ users: [] });
    }

    let currentUser = null;
    if (session?.user?.email) {
        currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
    }

    const whereClause: any = {
        name: { contains: q, mode: "insensitive" } // Add case-insensitivity while we're here, it's usually useful
    };

    if (currentUser) {
        whereClause.id = { not: currentUser.id };
    }

    const users = await prisma.user.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            _count: { select: { library: true } },
        },
        take: 20,
    });

    return NextResponse.json({
        users: users.map((u) => ({
            id: u.id,
            name: u.name,
            image: u.image,
            bio: u.bio,
            gameCount: u._count.library,
        })),
    });
}
