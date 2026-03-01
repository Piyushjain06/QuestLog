import { NextRequest, NextResponse } from "next/server";

// Search YouTube for a game trailer and return the video ID
export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get("q");
    if (!query) {
        return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    try {
        // Fetch YouTube search results page
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            },
        });

        const html = await response.text();

        // Extract video IDs from the YouTube search results page
        // YouTube embeds video IDs in the page's JSON data as "videoId":"XXXXXXXXXXX"
        const videoIdMatches = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g);

        if (!videoIdMatches || videoIdMatches.length === 0) {
            return NextResponse.json({ error: "No videos found" }, { status: 404 });
        }

        // Extract unique video IDs
        const seen = new Set<string>();
        const videoIds: string[] = [];
        for (const match of videoIdMatches) {
            const id = match.replace('"videoId":"', "").replace('"', "");
            if (!seen.has(id)) {
                seen.add(id);
                videoIds.push(id);
            }
            if (videoIds.length >= 3) break;
        }

        return NextResponse.json({
            videoId: videoIds[0],
            videoIds,
        });
    } catch (error) {
        console.error("YouTube search failed:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
