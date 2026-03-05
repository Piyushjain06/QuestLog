import { NextRequest, NextResponse } from "next/server";
import { getGameImages } from "@/lib/igdb";

export async function GET(req: NextRequest) {
    const igdbId = req.nextUrl.searchParams.get("igdbId");

    if (!igdbId) {
        return NextResponse.json({ error: "igdbId is required" }, { status: 400 });
    }

    try {
        const result = await getGameImages(parseInt(igdbId, 10));
        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch screenshots";
        console.error("Screenshots fetch error:", message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
