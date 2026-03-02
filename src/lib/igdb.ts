const IGDB_BASE = "https://api.igdb.com/v4";
const TWITCH_OAUTH_URL = "https://id.twitch.tv/oauth2/token";

function getCredentials() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are not set in .env");
    }
    return { clientId: clientId as string, clientSecret: clientSecret as string };
}

let accessToken: string | null = null;
let tokenExpiry = 0;

// ── Authentication ──────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
    const now = Date.now();
    // Refresh token if it expires in less than 5 minutes
    if (accessToken && tokenExpiry > now + 5 * 60 * 1000) {
        return accessToken;
    }

    const { clientId, clientSecret } = getCredentials();
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
    });

    const res = await fetch(`${TWITCH_OAUTH_URL}?${params}`, {
        method: "POST",
    });

    if (!res.ok) {
        throw new Error(`Failed to authenticate with Twitch: ${res.statusText}`);
    }

    const data = await res.json();
    accessToken = data.access_token as string;
    tokenExpiry = now + data.expires_in * 1000;

    return accessToken;
}

// ── Generic API call ────────────────────────────────────────────────────────

async function fetchIGDB(endpoint: string, query: string) {
    const token = await getAccessToken();
    const { clientId } = getCredentials();

    const res = await fetch(`${IGDB_BASE}/${endpoint}`, {
        method: "POST",
        headers: {
            "Client-ID": clientId,
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "text/plain", // Apicalypse syntax is sent as plain text
        },
        body: query,
    });

    if (!res.ok) {
        throw new Error(`IGDB API returned ${res.status}: ${res.statusText}`);
    }

    return await res.json();
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface IGDBGame {
    id: number;
    name: string;
    summary?: string;
    first_release_date?: number;
    total_rating?: number;
    genres?: { id: number; name: string }[];
    platforms?: { id: number; name: string }[];
    involved_companies?: {
        developer: boolean;
        publisher: boolean;
        company: { id: number; name: string };
    }[];
    cover?: { image_id: string };
}

export interface NormalizedGame {
    igdbId: number;
    title: string;
    description: string;
    coverUrl: string;
    releaseDate: string | null;
    rating: string | null;
    genres: string[];
    developers: string[];
    publishers: string[];
    platforms: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildImageUrl(imageId?: string, size = "cover_big"): string {
    if (!imageId) return "";
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

function normalizeGame(game: IGDBGame): NormalizedGame {
    const developers = game.involved_companies
        ?.filter((c) => c.developer)
        ?.map((c) => c.company.name) ?? [];

    const publishers = game.involved_companies
        ?.filter((c) => c.publisher)
        ?.map((c) => c.company.name) ?? [];

    const releaseDate = game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
        : null;

    return {
        igdbId: game.id,
        title: game.name,
        description: game.summary || "",
        coverUrl: buildImageUrl(game.cover?.image_id),
        releaseDate,
        rating: game.total_rating ? game.total_rating.toFixed(1) : null,
        genres: game.genres?.map((g) => g.name) ?? [],
        developers,
        publishers,
        platforms: game.platforms?.map((p) => p.name) ?? [],
    };
}

// ── Exported Methods ────────────────────────────────────────────────────────

const STANDARD_FIELDS = "name, summary, first_release_date, total_rating, genres.name, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, platforms.name, cover.image_id";

export async function searchGames(
    name: string,
    limit: number = 20,
    offset: number = 0
): Promise<{ games: NormalizedGame[]; count: number }> {
    // Escape quotes in the search term
    const safeName = name.replace(/"/g, '\\"');

    // Using IGDB's text search. We filter for only main games, remakes, remasters, ports
    const query = `
        search "${safeName}";
        fields ${STANDARD_FIELDS};
        where version_parent = null;
        limit ${limit};
        offset ${offset};
    `;

    const rawGames: IGDBGame[] = await fetchIGDB("games", query);

    // Since we can't easily get the total search count with 'search' keyword without a separate query,
    // we'll just say there's more if we got a full page
    return {
        games: rawGames.map(normalizeGame),
        count: rawGames.length === limit ? offset + limit + 1 : offset + rawGames.length
    };
}

export async function getGameById(id: number): Promise<NormalizedGame | null> {
    const query = `
        fields ${STANDARD_FIELDS};
        where id = ${id};
    `;

    const rawGames: IGDBGame[] = await fetchIGDB("games", query);

    if (!rawGames || rawGames.length === 0) return null;
    return normalizeGame(rawGames[0]);
}

export async function getGamesByPlatform(
    platformId: number,
    limit: number = 20,
    offset: number = 0
): Promise<{ games: NormalizedGame[]; count: number }> {
    const query = `
        fields ${STANDARD_FIELDS};
        where platforms = (${platformId}) & version_parent = null;
        sort total_rating desc;
        limit ${limit};
        offset ${offset};
    `;

    const rawGames: IGDBGame[] = await fetchIGDB("games", query);

    return {
        games: rawGames.map(normalizeGame),
        count: limit // rough estimation for pagination
    };
}

export async function getGameImages(gameId: number): Promise<{ baseUrl: string; images: string[] }> {
    // IGDB stores images in separate endpoints: artwork and screenshots
    const query = `
        fields image_id;
        where game = ${gameId};
    `;

    try {
        const artworks = await fetchIGDB("artworks", query);
        const screenshots = await fetchIGDB("screenshots", query);

        const images = [...artworks, ...screenshots].map(i => i.image_id);

        return {
            baseUrl: "https://images.igdb.com/igdb/image/upload/t_1080p/",
            images
        };
    } catch {
        return { baseUrl: "", images: [] };
    }
}
