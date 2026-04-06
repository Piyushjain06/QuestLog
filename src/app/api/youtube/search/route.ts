import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Search YouTube for a game trailer and return the video ID.
// NOTE: This scrapes YouTube HTML which violates their ToS. Migrate to the
//       official YouTube Data API v3 when a key is available.
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawQuery = req.nextUrl.searchParams.get("q") ?? "";
    // Sanitize: strip whitespace, cap length, reject empty
    const query = rawQuery.trim().slice(0, 200);
    if (!query) {
        return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            },
        });

        const html = await response.text();

        // Extract video IDs — regex only matches the YouTube 11-char ID format
        const videoIdMatches = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g);

        if (!videoIdMatches || videoIdMatches.length === 0) {
            return NextResponse.json({ error: "No videos found" }, { status: 404 });
        }

        const seen = new Set<string>();
        const videoIds: string[] = [];
        for (const match of videoIdMatches) {
            const id = match.replace('"videoId":"', "").replace('"', "");
            // Extra safety: re-validate extracted ID format before trusting it
            if (/^[a-zA-Z0-9_-]{11}$/.test(id) && !seen.has(id)) {
                seen.add(id);
                videoIds.push(id);
            }
            if (videoIds.length >= 3) break;
        }

        return NextResponse.json({ videoId: videoIds[0], videoIds });
    } catch (error) {
        console.error("YouTube search failed:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
