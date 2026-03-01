import { NextRequest, NextResponse } from "next/server";
import { getGameById } from "@/lib/tgdb";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
        }

        const game = await getGameById(id);
        if (!game) {
            return NextResponse.json({ error: "Game not found" }, { status: 404 });
        }

        return NextResponse.json(game);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch game";
        console.error("TGDB game fetch failed:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
