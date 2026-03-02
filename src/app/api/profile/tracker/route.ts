import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRACKER_GAMES } from "@/lib/tracker";

// PATCH — save / update linked Tracker.gg account
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { platform, username } = body as { platform?: string; username?: string };

    // Allow clearing
    if (!platform && !username) {
        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: { trackerPlatform: null, trackerUsername: null } as any,
        });
        return NextResponse.json({ trackerPlatform: (user as any).trackerPlatform, trackerUsername: (user as any).trackerUsername });
    }

    if (!platform || !username) {
        return NextResponse.json({ error: "Both platform and username are required" }, { status: 400 });
    }

    // Validate platform exists in at least one game
    const validPlatforms: string[] = [];
    for (const g of Object.values(TRACKER_GAMES)) {
        for (const p of g.platforms) {
            if (!validPlatforms.includes(p)) validPlatforms.push(p);
        }
    }
    if (!validPlatforms.includes(platform)) {
        return NextResponse.json(
            { error: `Invalid platform "${platform}". Valid: ${validPlatforms.join(", ")}` },
            { status: 400 }
        );
    }

    const user = await prisma.user.update({
        where: { email: session.user.email },
        data: { trackerPlatform: platform, trackerUsername: username.trim() } as any,
    });

    return NextResponse.json({ trackerPlatform: (user as any).trackerPlatform, trackerUsername: (user as any).trackerUsername });
}

// GET — return linked account info
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { trackerPlatform: true, trackerUsername: true } as any,
    });

    return NextResponse.json({
        trackerPlatform: (user as any)?.trackerPlatform || null,
        trackerUsername: (user as any)?.trackerUsername || null,
    });
}
