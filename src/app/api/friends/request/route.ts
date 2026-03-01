import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    const { receiverId } = await req.json();

    if (!receiverId || receiverId === currentUser.id) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Check receiver exists
    const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true },
    });
    if (!receiver) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for existing friendship in either direction
    const existing = await prisma.friendship.findFirst({
        where: {
            OR: [
                { senderId: currentUser.id, receiverId },
                { senderId: receiverId, receiverId: currentUser.id },
            ],
        },
    });

    if (existing) {
        return NextResponse.json(
            { error: "Friend request already exists", status: existing.status },
            { status: 409 }
        );
    }

    const friendship = await prisma.friendship.create({
        data: {
            senderId: currentUser.id,
            receiverId,
        },
    });

    return NextResponse.json({ success: true, friendship });
}
