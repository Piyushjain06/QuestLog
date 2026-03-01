import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bio } = body;

    if (typeof bio !== "string" || bio.length > 500) {
        return NextResponse.json(
            { error: "Bio must be a string of 500 characters or less" },
            { status: 400 }
        );
    }

    const user = await prisma.user.update({
        where: { email: session.user.email },
        data: { bio: bio.trim() || null },
    });

    return NextResponse.json({ bio: user.bio });
}
