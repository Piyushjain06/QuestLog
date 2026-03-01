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

    const { friendshipId, action } = await req.json();

    if (!friendshipId || !["ACCEPTED", "REJECTED"].includes(action)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const friendship = await prisma.friendship.findUnique({
        where: { id: friendshipId },
    });

    if (!friendship || friendship.receiverId !== currentUser.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (friendship.status !== "PENDING") {
        return NextResponse.json(
            { error: "Already responded" },
            { status: 409 }
        );
    }

    const updated = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: action },
    });

    return NextResponse.json({ success: true, friendship: updated });
}
