// Steam Web API integration
// Docs: https://developer.valvesoftware.com/wiki/Steam_Web_API

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_STORE_API = "https://store.steampowered.com/api";

interface SteamOwnedGame {
    appid: number;
    name: string;
    playtime_forever: number; // minutes
    img_icon_url: string;
    has_community_visible_stats: boolean;
}

interface SteamGameDetails {
    name: string;
    steam_appid: number;
    short_description: string;
    header_image: string;
    genres?: Array<{ id: string; description: string }>;
    categories?: Array<{ id: number; description: string }>;
    developers?: string[];
    publishers?: string[];
    release_date?: { coming_soon: boolean; date: string };
    metacritic?: { score: number };
}

export interface NormalizedSteamGame {
    steamAppId: string;
    title: string;
    description: string;
    coverUrl: string;
    genres: string[];
    tags: string[];
    platforms: string[];
    developer: string;
    publisher: string;
    releaseDate: string;
    rating: number | null;
    playtimeMinutes: number;
}

export async function fetchOwnedGames(steamId: string): Promise<SteamOwnedGame[]> {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) throw new Error("STEAM_API_KEY not configured");

    const url = `${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Steam API error: ${res.status}`);

    const data = await res.json();
    return data?.response?.games ?? [];
}

export async function fetchGameDetails(appId: number): Promise<SteamGameDetails | null> {
    try {
        const url = `${STEAM_STORE_API}/appdetails?appids=${appId}`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        const gameData = data?.[String(appId)];
        if (!gameData?.success) return null;

        return gameData.data as SteamGameDetails;
    } catch {
        return null;
    }
}

export async function importSteamLibrary(steamId: string): Promise<NormalizedSteamGame[]> {
    const ownedGames = await fetchOwnedGames(steamId);
    const normalizedGames: NormalizedSteamGame[] = [];

    // Process games in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < Math.min(ownedGames.length, 50); i += batchSize) {
        const batch = ownedGames.slice(i, i + batchSize);
        const details = await Promise.all(
            batch.map((game) => fetchGameDetails(game.appid))
        );

        for (let j = 0; j < batch.length; j++) {
            const game = batch[j];
            const detail = details[j];

            normalizedGames.push({
                steamAppId: String(game.appid),
                title: detail?.name ?? game.name,
                description: detail?.short_description ?? "",
                coverUrl:
                    detail?.header_image ??
                    `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
                genres: detail?.genres?.map((g) => g.description) ?? [],
                tags: detail?.categories?.map((c) => c.description) ?? [],
                platforms: ["PC"],
                developer: detail?.developers?.[0] ?? "Unknown",
                publisher: detail?.publishers?.[0] ?? "Unknown",
                releaseDate: detail?.release_date?.date ?? "",
                rating: detail?.metacritic?.score ? detail.metacritic.score / 10 : null,
                playtimeMinutes: game.playtime_forever,
            });
        }

        // Rate limit delay
        if (i + batchSize < ownedGames.length) {
            await new Promise((r) => setTimeout(r, 1500));
        }
    }

    return normalizedGames;
}
