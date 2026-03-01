import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
    });
    if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Accepted friends (both directions)
    const friendships = await prisma.friendship.findMany({
        where: {
            status: "ACCEPTED",
            OR: [
                { senderId: currentUser.id },
                { receiverId: currentUser.id },
            ],
        },
        include: {
            sender: { select: { id: true, name: true, image: true, bio: true } },
            receiver: { select: { id: true, name: true, image: true, bio: true } },
        },
        orderBy: { updatedAt: "desc" },
    });

    const friends = friendships.map((f) => {
        const friend = f.senderId === currentUser.id ? f.receiver : f.sender;
        return { ...friend, friendshipId: f.id };
    });

    // Pending incoming requests
    const pendingRequests = await prisma.friendship.findMany({
        where: {
            receiverId: currentUser.id,
            status: "PENDING",
        },
        include: {
            sender: { select: { id: true, name: true, image: true, bio: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const pending = pendingRequests.map((r) => ({
        friendshipId: r.id,
        ...r.sender,
        sentAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ friends, pending });
}
