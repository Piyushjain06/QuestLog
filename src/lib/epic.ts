/**
 * Epic Games Import Service
 *
 * Epic Games does not provide a public API for fetching a user's game library.
 * This service supports importing via:
 * 1. Manual JSON/CSV upload (user exports from Epic launcher or legendary CLI)
 * 2. Parsing legendary CLI output
 *
 * To export with legendary CLI:
 *   pip install legendary-gl
 *   legendary list-installed --json > epic_games.json
 *   legendary list-games --json > all_epic_games.json
 */

export interface EpicGameEntry {
    app_name: string;
    title: string;
    install_size?: number;
    version?: string;
    platform?: string;
}

export interface NormalizedEpicGame {
    epicId: string;
    title: string;
    description: string;
    coverUrl: string;
    genres: string[];
    tags: string[];
    platforms: string[];
}

export function parseLegendaryExport(jsonString: string): NormalizedEpicGame[] {
    try {
        const data = JSON.parse(jsonString);
        const games: EpicGameEntry[] = Array.isArray(data) ? data : data.games ?? [];

        return games.map((game) => ({
            epicId: game.app_name,
            title: game.title,
            description: "",
            coverUrl: "",
            genres: [],
            tags: [],
            platforms: [game.platform ?? "PC"],
        }));
    } catch (error) {
        throw new Error("Failed to parse Epic games export. Ensure valid JSON format.");
    }
}

export function parseManualCsv(csvString: string): NormalizedEpicGame[] {
    const lines = csvString.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const titleIdx = headers.findIndex((h) => h.includes("title") || h.includes("name"));
    const idIdx = headers.findIndex((h) => h.includes("id") || h.includes("app"));

    if (titleIdx === -1) throw new Error("CSV must have a 'title' or 'name' column");

    return lines.slice(1).map((line, i) => {
        const cols = line.split(",").map((c) => c.trim());
        return {
            epicId: idIdx >= 0 ? cols[idIdx] : `epic-manual-${i}`,
            title: cols[titleIdx],
            description: "",
            coverUrl: "",
            genres: [],
            tags: [],
            platforms: ["PC"],
        };
    });
}
