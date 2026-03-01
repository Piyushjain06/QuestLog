import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
        return NextResponse.json({ users: [] });
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });

    const users = await prisma.user.findMany({
        where: {
            AND: [
                { name: { contains: q } },
                { id: { not: currentUser?.id } },
            ],
        },
        select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            _count: { select: { gameLibrary: true } },
        },
        take: 20,
    });

    return NextResponse.json({
        users: users.map((u) => ({
            id: u.id,
            name: u.name,
            image: u.image,
            bio: u.bio,
            gameCount: u._count.gameLibrary,
        })),
    });
}
