import { NextResponse } from "next/server";
import { fetchTrackerProfile, TRACKER_GAMES, type TrackerGame } from "@/lib/tracker";

export async function GET(
    _req: Request,
    { params }: { params: { game: string; platform: string; username: string } }
) {
    const { game, platform, username } = params;

    // Validate game
    if (!Object.keys(TRACKER_GAMES).includes(game)) {
        return NextResponse.json(
            { error: `Unsupported game "${game}". Supported: ${Object.keys(TRACKER_GAMES).join(", ")}` },
            { status: 400 }
        );
    }

    // Validate platform
    const validPlatforms = TRACKER_GAMES[game as TrackerGame].platforms as readonly string[];
    if (!validPlatforms.includes(platform)) {
        return NextResponse.json(
            { error: `Unsupported platform "${platform}" for ${game}. Supported: ${validPlatforms.join(", ")}` },
            { status: 400 }
        );
    }

    try {
        const profile = await fetchTrackerProfile(game, platform, username);
        return NextResponse.json(profile);
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch stats";
        console.error(`[Tracker API] ${game}/${platform}/${username} — ${message}`);
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
