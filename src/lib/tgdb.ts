const TGDB_BASE = "https://api.thegamesdb.net";

function getApiKey(): string {
    const key = process.env.TGDB_API_KEY;
    if (!key) throw new Error("TGDB_API_KEY is not set in .env");
    return key;
}

// ── Cached lookup maps ──────────────────────────────────────────────────────

let genreCache: Record<number, string> | null = null;
let devCache: Record<number, string> | null = null;
let pubCache: Record<number, string> | null = null;

export async function getGenres(): Promise<Record<number, string>> {
    if (genreCache) return genreCache;
    const res = await fetch(`${TGDB_BASE}/v1/Genres?apikey=${getApiKey()}`);
    const json = await res.json();
    const map: Record<number, string> = {};
    if (json.data?.genres) {
        for (const [id, g] of Object.entries(json.data.genres) as [string, { name: string }][]) {
            map[Number(id)] = g.name;
        }
    }
    genreCache = map;
    return map;
}

export async function getDevelopers(): Promise<Record<number, string>> {
    if (devCache) return devCache;
    const res = await fetch(`${TGDB_BASE}/v1/Developers?apikey=${getApiKey()}`);
    const json = await res.json();
    const map: Record<number, string> = {};
    if (json.data?.developers) {
        for (const [id, d] of Object.entries(json.data.developers) as [string, { name: string }][]) {
            map[Number(id)] = d.name;
        }
    }
    devCache = map;
    return map;
}

export async function getPublishers(): Promise<Record<number, string>> {
    if (pubCache) return pubCache;
    const res = await fetch(`${TGDB_BASE}/v1/Publishers?apikey=${getApiKey()}`);
    const json = await res.json();
    const map: Record<number, string> = {};
    if (json.data?.publishers) {
        for (const [id, p] of Object.entries(json.data.publishers) as [string, { name: string }][]) {
            map[Number(id)] = p.name;
        }
    }
    pubCache = map;
    return map;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface TGDBGame {
    id: number;
    game_title: string;
    release_date: string | null;
    platform: number;
    overview: string | null;
    rating: string | null;
    developers: number[];
    genres: number[];
    publishers: number[];
    players: number | null;
    coop: string | null;
    youtube: string | null;
}

export interface TGDBBoxart {
    id: number;
    type: string;
    side?: string;
    filename: string;
    resolution?: string;
}

export interface NormalizedTGDBGame {
    tgdbId: number;
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

// ── Image URL builder ───────────────────────────────────────────────────────

function buildCoverUrl(
    baseUrl: string | undefined,
    boxartList: TGDBBoxart[] | undefined
): string {
    if (!baseUrl || !boxartList || boxartList.length === 0) return "";
    // Prefer front boxart
    const front = boxartList.find((b) => b.side === "front" && b.type === "boxart");
    const art = front || boxartList[0];
    // Use "medium" size for performance
    const mediumBase = baseUrl.replace("/original/", "/medium/");
    return `${mediumBase}${art.filename}`;
}

// ── Resolve IDs to names ────────────────────────────────────────────────────

async function resolveGame(
    game: TGDBGame,
    boxartMap: Record<string, TGDBBoxart[]>,
    imageBaseUrl: string,
    platformMap: Record<string, { name: string }>,
): Promise<NormalizedTGDBGame> {
    const [genres, devs, pubs] = await Promise.all([
        getGenres(),
        getDevelopers(),
        getPublishers(),
    ]);

    const coverUrl = buildCoverUrl(imageBaseUrl, boxartMap[String(game.id)]);

    return {
        tgdbId: game.id,
        title: game.game_title,
        description: game.overview ?? "",
        coverUrl,
        releaseDate: game.release_date,
        rating: game.rating,
        genres: (game.genres ?? []).map((id) => genres[id] ?? `Genre ${id}`),
        developers: (game.developers ?? []).map((id) => devs[id] ?? `Dev ${id}`),
        publishers: (game.publishers ?? []).map((id) => pubs[id] ?? `Pub ${id}`),
        platforms: platformMap[String(game.platform)]
            ? [platformMap[String(game.platform)].name]
            : [],
    };
}

// ── Search games by name ────────────────────────────────────────────────────

/**
 * Simple heuristic: check if text contains common English words.
 * Not perfect, but filters out obviously non-English descriptions.
 */
function isLikelyEnglish(text: string): boolean {
    if (!text || text.length < 10) return false;
    const lower = text.toLowerCase();
    const englishMarkers = ["the", " is ", " a ", " an ", " and ", " of ", " in ", " to ", " you ", " with ", " for ", " that ", " this ", " game ", " play"];
    const matches = englishMarkers.filter((m) => lower.includes(m)).length;
    return matches >= 2;
}

/**
 * TGDB returns separate entries per platform/region, often with non-English
 * descriptions. This groups results by title, picks the best (English) entry,
 * and merges all platforms into one result.
 */
function deduplicateByTitle(games: NormalizedTGDBGame[]): NormalizedTGDBGame[] {
    const map = new Map<string, NormalizedTGDBGame>();

    for (const game of games) {
        const key = game.title.toLowerCase().trim();
        const existing = map.get(key);

        if (!existing) {
            map.set(key, { ...game, platforms: [...game.platforms] });
        } else {
            // Merge platforms
            for (const p of game.platforms) {
                if (!existing.platforms.includes(p)) {
                    existing.platforms.push(p);
                }
            }
            // Prefer English description
            if (!isLikelyEnglish(existing.description) && isLikelyEnglish(game.description)) {
                existing.description = game.description;
                existing.tgdbId = game.tgdbId;
                if (game.coverUrl) existing.coverUrl = game.coverUrl;
                if (game.rating) existing.rating = game.rating;
            }
        }
    }

    return Array.from(map.values());
}

export async function searchGames(
    name: string,
    page: number = 1
): Promise<{ games: NormalizedTGDBGame[]; pages: { next: string; previous: string } }> {
    const params = new URLSearchParams({
        apikey: getApiKey(),
        name,
        fields: "players,publishers,genres,overview,rating,platform",
        include: "boxart,platform",
        page: String(page),
    });

    const res = await fetch(`${TGDB_BASE}/v1.1/Games/ByGameName?${params}`, {
        signal: AbortSignal.timeout(5000),
    });

    if (res.status === 429) {
        throw new Error("TGDB rate limit exceeded — monthly API allowance used up");
    }

    if (!res.ok) {
        throw new Error(`TGDB API returned ${res.status}`);
    }

    const json = await res.json();

    if (!json.data?.games || json.data.count === 0) {
        return { games: [], pages: { next: "", previous: "" } };
    }

    const imageBaseUrl = json.include?.boxart?.base_url?.original ?? "";
    const boxartData: Record<string, TGDBBoxart[]> = json.include?.boxart?.data ?? {};
    const platformData: Record<string, { name: string }> = json.include?.platform?.data ?? {};

    const games = await Promise.all(
        json.data.games.map((g: TGDBGame) =>
            resolveGame(g, boxartData, imageBaseUrl, platformData)
        )
    );

    // Deduplicate by title — TGDB returns separate entries per platform/region.
    // Prefer entries with English descriptions and merge platforms.
    const deduped = deduplicateByTitle(games);

    return {
        games: deduped,
        pages: json.pages ?? { next: "", previous: "" },
    };
}

// ── Get game by TGDB ID ─────────────────────────────────────────────────────

export async function getGameById(
    id: number
): Promise<NormalizedTGDBGame | null> {
    const params = new URLSearchParams({
        apikey: getApiKey(),
        id: String(id),
        fields: "players,publishers,genres,overview,rating,platform",
        include: "boxart,platform",
    });

    const res = await fetch(`${TGDB_BASE}/v1/Games/ByGameID?${params}`);
    const json = await res.json();

    if (!json.data?.games || json.data.count === 0) return null;

    const imageBaseUrl = json.include?.boxart?.base_url?.original ?? "";
    const boxartData: Record<string, TGDBBoxart[]> = json.include?.boxart?.data ?? {};
    const platformData: Record<string, { name: string }> = json.include?.platform?.data ?? {};

    return resolveGame(json.data.games[0], boxartData, imageBaseUrl, platformData);
}

// ── Get games by platform ───────────────────────────────────────────────────

export async function getGamesByPlatform(
    platformId: number,
    page: number = 1
): Promise<{ games: NormalizedTGDBGame[]; pages: { next: string; previous: string } }> {
    const params = new URLSearchParams({
        apikey: getApiKey(),
        id: String(platformId),
        fields: "players,publishers,genres,overview,rating,platform",
        include: "boxart,platform",
        page: String(page),
    });

    const res = await fetch(`${TGDB_BASE}/v1/Games/ByPlatformID?${params}`);
    const json = await res.json();

    if (!json.data?.games || json.data.count === 0) {
        return { games: [], pages: { next: "", previous: "" } };
    }

    const imageBaseUrl = json.include?.boxart?.base_url?.original ?? "";
    const boxartData: Record<string, TGDBBoxart[]> = json.include?.boxart?.data ?? {};
    const platformData: Record<string, { name: string }> = json.include?.platform?.data ?? {};

    const games = await Promise.all(
        json.data.games.map((g: TGDBGame) =>
            resolveGame(g, boxartData, imageBaseUrl, platformData)
        )
    );

    return {
        games,
        pages: json.pages ?? { next: "", previous: "" },
    };
}

// ── Get game images ─────────────────────────────────────────────────────────

export async function getGameImages(
    gameId: number,
    filterType?: string
): Promise<{ baseUrl: string; images: TGDBBoxart[] }> {
    const params = new URLSearchParams({
        apikey: getApiKey(),
        games_id: String(gameId),
    });
    if (filterType) params.set("filter[type]", filterType);

    const res = await fetch(`${TGDB_BASE}/v1/Games/Images?${params}`);
    const json = await res.json();

    const baseUrl = json.data?.base_url?.original ?? "";
    const images: TGDBBoxart[] = json.data?.images?.[String(gameId)] ?? [];

    return { baseUrl, images };
}
