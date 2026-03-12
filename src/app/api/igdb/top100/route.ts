import { NextRequest, NextResponse } from "next/server";
import { fetchIGDB } from "@/lib/igdb";

const STANDARD_FIELDS =
    "name, summary, first_release_date, total_rating, total_rating_count, rating, rating_count, aggregated_rating, aggregated_rating_count, genres.name, themes.name, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, platforms.name, cover.image_id";

function buildImageUrl(imageId?: string, size = "cover_big"): string {
    if (!imageId) return "";
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

/**
 * Bayesian weighted rating — same approach IGDB uses for their Top 100.
 * Penalises games with few votes so a 100% from 10 people doesn't beat
 * a 95% from 100,000 people.
 *   score = (v * R + m * C) / (v + m)
 *   v = vote count, R = raw average, m = min votes threshold (prior weight), C = global mean
 */
function bayesianScore(rating: number, count: number, mean = 80, prior = 5000): number {
    return (count * rating + prior * mean) / (count + prior);
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const genre = searchParams.get("genre") || "";
        const platform = searchParams.get("platform") || "";
        const fromYear = parseInt(searchParams.get("fromYear") || "0");
        const toYear = parseInt(searchParams.get("toYear") || "0");
        const poolSize = 200; // fetch large pool, Bayesian re-rank picks best 100
        const offset = parseInt(searchParams.get("offset") || "0");

        const whereParts: string[] = [
            "version_parent = null",
            "cover != null",
            "total_rating != null",
            "total_rating_count >= 500", // 500+ votes — Bayesian scoring handles the rest (low-vote games get penalised)
        ];

        if (genre) {
            whereParts.push(`genres.name = "${genre}"`);
        }

        if (platform) {
            const platformMap: Record<string, string> = {
                PC: "PC",
                PlayStation: "PlayStation",
                Xbox: "Xbox",
                Nintendo: "Nintendo",
                iOS: "iOS",
                Android: "Android",
            };
            const igdbPlatform = platformMap[platform] || platform;
            whereParts.push(`platforms.name ~ *"${igdbPlatform}"*`);
        }

        if (fromYear > 0) {
            const fromTs = Math.floor(new Date(`${fromYear}-01-01`).getTime() / 1000);
            whereParts.push(`first_release_date >= ${fromTs}`);
        }

        if (toYear > 0) {
            const toTs = Math.floor(new Date(`${toYear}-12-31`).getTime() / 1000);
            whereParts.push(`first_release_date <= ${toTs}`);
        }

        const whereClause = whereParts.join(" & ");

        // Fetch a larger pool sorted by total_rating first, then we re-rank by Bayesian score client-side
        const query = `
            fields ${STANDARD_FIELDS};
            where ${whereClause};
            sort total_rating desc;
            limit ${poolSize};
            offset ${offset};
        `;

        const rawGames = await fetchIGDB("games", query);

        // Re-rank by Bayesian weighted score then slice to 100
        const scored = rawGames.map((game: any) => {
            const developers =
                game.involved_companies
                    ?.filter((c: any) => c.developer)
                    ?.map((c: any) => c.company.name) ?? [];
            const publishers =
                game.involved_companies
                    ?.filter((c: any) => c.publisher)
                    ?.map((c: any) => c.company.name) ?? [];

            const score = bayesianScore(
                game.total_rating ?? 0,
                game.total_rating_count ?? 0
            );

            return {
                _score: score,
                igdbId: game.id,
                title: game.name,
                description: game.summary || "",
                coverUrl: buildImageUrl(game.cover?.image_id),
                releaseDate: game.first_release_date
                    ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
                    : null,
                rating: game.total_rating ? Math.round(game.total_rating) : null,
                ratingCount: game.total_rating_count ?? 0,
                genres: game.genres?.map((g: any) => g.name) ?? [],
                themes: game.themes?.map((t: any) => t.name) ?? [],
                developers,
                publishers,
                platforms: game.platforms?.map((p: any) => p.name) ?? [],
            };
        });

        scored.sort((a: any, b: any) => b._score - a._score);

        const games = scored.slice(0, 100).map((g: any, i: number) => ({
            rank: offset + i + 1,
            igdbId: g.igdbId,
            title: g.title,
            description: g.description,
            coverUrl: g.coverUrl,
            releaseDate: g.releaseDate,
            rating: g.rating,
            ratingCount: g.ratingCount,
            genres: g.genres,
            themes: g.themes,
            developers: g.developers,
            publishers: g.publishers,
            platforms: g.platforms,
        }));

        return NextResponse.json({ games });
    } catch (error) {
        console.error("Top 100 API error:", error);
        return NextResponse.json({ error: "Failed to fetch top games" }, { status: 500 });
    }
}
