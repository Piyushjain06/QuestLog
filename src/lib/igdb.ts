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
    hypes?: number;
    follows?: number;
    genres?: { id: number; name: string }[];
    themes?: { id: number; name: string }[];
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
    themes: string[];
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
        themes: game.themes?.map((t) => t.name) ?? [],
        developers,
        publishers,
        platforms: game.platforms?.map((p) => p.name) ?? [],
    };
}

// ── Exported Methods ────────────────────────────────────────────────────────

const STANDARD_FIELDS = "name, summary, first_release_date, total_rating, genres.name, themes.name, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, platforms.name, cover.image_id";

export async function searchGames(
    name: string,
    limit: number = 20,
    offset: number = 0,
    genres: string[] = [],
    themes: string[] = []
): Promise<{ games: NormalizedGame[]; count: number }> {
    // Build dynamic where conditions
    const whereParts: string[] = ["version_parent = null"];

    if (genres.length > 0) {
        const genreConditions = genres.map((g) => `genres.name ~ *"${g}"*`).join(" | ");
        whereParts.push(`(${genreConditions})`);
    }

    if (themes.length > 0) {
        const themeConditions = themes.map((t) => `themes.name ~ *"${t}"*`).join(" | ");
        whereParts.push(`(${themeConditions})`);
    }

    const whereClause = whereParts.join(" & ");
    const hasTextSearch = name.trim().length > 0;

    let query: string;

    if (hasTextSearch) {
        // Escape quotes in the search term
        const safeName = name.replace(/"/g, '\\"');
        // Using IGDB's text search combined with optional genre/theme filters
        query = `
            search "${safeName}";
            fields ${STANDARD_FIELDS};
            where ${whereClause};
            limit ${limit};
            offset ${offset};
        `;
    } else {
        // No text search — browse by genre/theme filters, sorted by rating
        query = `
            fields ${STANDARD_FIELDS};
            where ${whereClause} & cover != null & total_rating_count >= 3;
            sort total_rating desc;
            limit ${limit};
            offset ${offset};
        `;
    }

    const rawGames: IGDBGame[] = await fetchIGDB("games", query);

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

/**
 * Fetch similar games from IGDB API by matching the source game's genres and themes.
 * Requires ALL themes to match; falls back to OR if strict matching returns nothing.
 */
export async function getSimilarGamesFromIGDB(
    igdbId: number,
    limit: number = 5
): Promise<NormalizedGame[]> {
    try {
        // 1. Fetch the source game to get its genre + theme IDs
        const sourceQuery = `
            fields genres, themes;
            where id = ${igdbId};
        `;
        const sourceResults: Array<{ id: number; genres?: number[]; themes?: number[] }> =
            await fetchIGDB("games", sourceQuery);

        if (!sourceResults || sourceResults.length === 0) return [];

        const source = sourceResults[0];
        const genreIds = source.genres ?? [];
        const themeIds = source.themes ?? [];

        if (genreIds.length === 0 && themeIds.length === 0) return [];

        const baseFilter = `id != ${igdbId} & version_parent = null & cover != null & total_rating != null`;

        // 2. Build a strict filter: must match ALL themes (AND) + at least one genre
        const strictThemeFilters = themeIds.map((id) => `themes = (${id})`);
        const strictParts = [...strictThemeFilters];
        if (genreIds.length > 0) strictParts.push(`genres = (${genreIds.join(",")})`);

        const strictQuery = `
            fields ${STANDARD_FIELDS};
            where ${strictParts.join(" & ")} & ${baseFilter};
            sort total_rating desc;
            limit ${limit};
        `;

        let rawGames: IGDBGame[] = await fetchIGDB("games", strictQuery);

        // 3. Fallback: if strict AND returned nothing, relax to OR
        if (rawGames.length === 0) {
            const relaxedParts: string[] = [];
            if (genreIds.length > 0) relaxedParts.push(`genres = (${genreIds.join(",")})`);
            if (themeIds.length > 0) relaxedParts.push(`themes = (${themeIds.join(",")})`);
            const orFilter = relaxedParts.length > 1 ? `(${relaxedParts.join(" | ")})` : relaxedParts[0];

            const relaxedQuery = `
                fields ${STANDARD_FIELDS};
                where ${orFilter} & ${baseFilter};
                sort total_rating desc;
                limit ${limit};
            `;

            rawGames = await fetchIGDB("games", relaxedQuery);
        }

        return rawGames.map(normalizeGame);
    } catch (error) {
        console.warn("Failed to fetch similar games from IGDB:", error);
        return [];
    }
}

/**
 * Fetch trending games: highly-rated titles released in the last 3 months.
 */
export async function getTrendingGames(limit: number = 12): Promise<NormalizedGame[]> {
    try {
        const threeMonthsAgo = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
        const now = Math.floor(Date.now() / 1000);

        const query = `
            fields ${STANDARD_FIELDS};
            where first_release_date >= ${threeMonthsAgo}
                & first_release_date <= ${now}
                & version_parent = null
                & cover != null
                & total_rating_count >= 5;
            sort total_rating desc;
            limit ${limit};
        `;

        const rawGames: IGDBGame[] = await fetchIGDB("games", query);
        return rawGames.map(normalizeGame);
    } catch (error) {
        console.warn("Failed to fetch trending games from IGDB:", error);
        return [];
    }
}

/**
 * Fetch upcoming game releases: games with a future release date.
 */
export async function getUpcomingGames(limit: number = 12): Promise<NormalizedGame[]> {
    try {
        const now = Math.floor(Date.now() / 1000);
        const oneYearFromNow = now + 365 * 24 * 60 * 60;

        const query = `
            fields ${STANDARD_FIELDS};
            where first_release_date > ${now}
                & first_release_date < ${oneYearFromNow}
                & version_parent = null
                & cover != null;
            sort first_release_date asc;
            limit ${limit};
        `;

        const rawGames: IGDBGame[] = await fetchIGDB("games", query);
        return rawGames.map(normalizeGame);
    } catch (error) {
        console.warn("Failed to fetch upcoming games from IGDB:", error);
        return [];
    }
}

/**
 * Fetch most anticipated games: upcoming titles sorted by hype/follows.
 */
export async function getMostAnticipatedGames(limit: number = 8): Promise<NormalizedGame[]> {
    try {
        const now = Math.floor(Date.now() / 1000);

        const query = `
            fields ${STANDARD_FIELDS}, hypes, follows;
            where first_release_date > ${now}
                & version_parent = null
                & cover != null
                & hypes > 1;
            sort hypes desc;
            limit ${limit};
        `;

        const rawGames: IGDBGame[] = await fetchIGDB("games", query);
        return rawGames.map(normalizeGame);
    } catch (error) {
        console.warn("Failed to fetch most anticipated games from IGDB:", error);
        return [];
    }
}

/**
 * Fetch coming soon games: releasing within the next 14 days.
 */
/**
 * Fetch recommended games based on genre/theme names.
 * Used by the recommender system to get IGDB candidates matching a user's taste.
 */
export async function getRecommendedGames(
    genreNames: string[],
    excludeIgdbIds: number[] = [],
    limit: number = 20
): Promise<NormalizedGame[]> {
    try {
        if (genreNames.length === 0) return [];

        // Build genre/theme name filters — match any of the user's preferred genres or themes
        const genreConditions = genreNames.map((g) => `genres.name ~ *"${g}"*`).join(" | ");
        const themeConditions = genreNames.map((g) => `themes.name ~ *"${g}"*`).join(" | ");

        const excludeClause = excludeIgdbIds.length > 0
            ? `& id != (${excludeIgdbIds.join(",")})`
            : "";

        const query = `
            fields ${STANDARD_FIELDS};
            where (${genreConditions} | ${themeConditions})
                & version_parent = null
                & cover != null
                & total_rating_count >= 5
                & total_rating >= 70
                ${excludeClause};
            sort total_rating desc;
            limit ${limit};
        `;

        const rawGames: IGDBGame[] = await fetchIGDB("games", query);
        return rawGames.map(normalizeGame);
    } catch (error) {
        console.warn("Failed to fetch recommended games from IGDB:", error);
        return [];
    }
}

export async function getComingSoonGames(limit: number = 12): Promise<NormalizedGame[]> {
    try {
        const now = Math.floor(Date.now() / 1000);
        const twoWeeksFromNow = now + 14 * 24 * 60 * 60;

        const query = `
            fields ${STANDARD_FIELDS};
            where first_release_date >= ${now}
                & first_release_date <= ${twoWeeksFromNow}
                & version_parent = null
                & cover != null;
            sort first_release_date asc;
            limit ${limit};
        `;

        const rawGames: IGDBGame[] = await fetchIGDB("games", query);
        return rawGames.map(normalizeGame);
    } catch (error) {
        console.warn("Failed to fetch coming soon games from IGDB:", error);
        return [];
    }
}
