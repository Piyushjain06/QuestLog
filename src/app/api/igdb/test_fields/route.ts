import { NextResponse } from "next/server";
import { fetchIGDB } from "@/lib/igdb";

export async function GET() {
    try {
        const query = "fields name, websites.url, websites.category, release_dates.human, release_dates.platform.name, release_dates.y, game_time_to_beats.hastly, game_time_to_beats.normally, game_time_to_beats.completely; where id = 1942;";
        const res = await fetchIGDB("games", query);
        return NextResponse.json({ data: res });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack });
    }
}
