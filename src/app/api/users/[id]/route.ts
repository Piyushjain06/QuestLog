import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    const currentEmail = session?.user?.email;

    const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            createdAt: true,
            library: {
                include: { game: true },
                orderBy: { updatedAt: "desc" },
            },
        },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine friendship status with current user
    let friendshipStatus: string | null = null;
    let friendshipId: string | null = null;

    if (currentEmail) {
        const currentUser = await prisma.user.findUnique({
            where: { email: currentEmail },
            select: { id: true },
        });

        if (currentUser && currentUser.id !== user.id) {
            const friendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        { senderId: currentUser.id, receiverId: user.id },
                        { senderId: user.id, receiverId: currentUser.id },
                    ],
                },
            });

            if (friendship) {
                friendshipStatus = friendship.status;
                friendshipId = friendship.id;
            }
        }
    }

    return NextResponse.json({
        user: {
            id: user.id,
            name: user.name,
            image: user.image,
            bio: user.bio,
            joinedAt: user.createdAt.toISOString(),
        },
        library: JSON.parse(JSON.stringify(user.library)),
        friendshipStatus,
        friendshipId,
    });
}
