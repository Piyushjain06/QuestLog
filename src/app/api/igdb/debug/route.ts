import { NextResponse } from "next/server";
const IGDB_BASE = "https://api.igdb.com/v4";
const TWITCH_OAUTH_URL = "https://id.twitch.tv/oauth2/token";

async function getAccessToken(): Promise<string> {
    const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: "client_credentials",
    });
    const res = await fetch(`${TWITCH_OAUTH_URL}?${params}`, { method: "POST" });
    const data = await res.json();
    return data.access_token;
}

export async function GET() {
    try {
        const token = await getAccessToken();
        const query = `
            fields *;
            where id = 1942;
        `;
        const res = await fetch(`${IGDB_BASE}/games`, {
            method: "POST",
            headers: {
                "Client-ID": process.env.TWITCH_CLIENT_ID!,
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
                "Content-Type": "text/plain",
            },
            body: query,
        });
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
