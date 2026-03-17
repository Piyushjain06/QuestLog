import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { cacheGlobalAchievements, fetchUserAchievements } from "@/lib/steamTracker";
import { fetchIGDB } from "@/lib/igdb";

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const TWO_WEEKS_SECS = 14 * 24 * 60 * 60;
const IGDB_BATCH_SIZE = 10; // IGDB allows up to 10 items per external_games query safely

type SteamGame = {
    appid: number;
    name: string;
    playtime_forever: number;
    rtime_last_played?: number;
};

type IGDBCoverLookup = {
    steamAppId: string;
    igdbId: string | null;
    coverUrl: string | null;
    igdbTitle: string | null;
};

/**
 * Batch-looks up Steam app IDs in IGDB's external_games table and returns
 * the IGDB cover URL (t_cover_big) for each app that has a match.
 */
async function batchFetchIGDBCovers(steamAppIds: string[]): Promise<Map<string, IGDBCoverLookup>> {
    const result = new Map<string, IGDBCoverLookup>();

    // Process in small batches to stay within IGDB limits
    for (let i = 0; i < steamAppIds.length; i += IGDB_BATCH_SIZE) {
        const batch = steamAppIds.slice(i, i + IGDB_BATCH_SIZE);
        const uidList = batch.map((id) => `"${id}"`).join(",");

        try {
            // Step 1: Get IGDB game IDs from external_games
            const externalGames = await fetchIGDB(
                "external_games",
                `fields uid, game; where uid = (${uidList}) & category = 1; limit ${IGDB_BATCH_SIZE};`
                // category = 1 is Steam
            );

            if (!externalGames?.length) continue;

            // Build a map of steamAppId → igdbGameId
            const igdbIds: number[] = externalGames.map((eg: any) => eg.game).filter(Boolean);
            const steamToIgdb = new Map<string, string>(
                externalGames.map((eg: any) => [eg.uid, String(eg.game)])
            );

            if (!igdbIds.length) continue;

            // Step 2: Fetch cover image_ids for those IGDB game IDs
            const igdbGames = await fetchIGDB(
                "games",
                `fields id, name, cover.image_id; where id = (${igdbIds.join(",")}); limit ${IGDB_BATCH_SIZE};`
            );

            if (!igdbGames?.length) continue;

            const igdbGameMap = new Map<string, { coverUrl: string | null; title: string }>(
                igdbGames.map((g: any) => [
                    String(g.id),
                    {
                        coverUrl: g.cover?.image_id
                            ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
                            : null,
                        title: g.name,
                    },
                ])
            );

            for (const [steamAppId, igdbId] of Array.from(steamToIgdb.entries())) {
                const igdbData = igdbGameMap.get(igdbId);
                result.set(steamAppId, {
                    steamAppId,
                    igdbId,
                    coverUrl: igdbData?.coverUrl ?? null,
                    igdbTitle: igdbData?.title ?? null,
                });
            }
        } catch (err) {
            // If IGDB fails for a batch, skip it — don't fail the whole import
            console.error(`IGDB batch lookup failed for batch starting at ${i}:`, err);
        }

        // Small delay between batches to avoid IGDB rate limits
        if (i + IGDB_BATCH_SIZE < steamAppIds.length) {
            await new Promise((r) => setTimeout(r, 250));
        }
    }

    return result;
}

/**
 * Fetches all games from a user's Steam library, looks up IGDB cover art,
 * and imports them into QuestLog with achievement syncing.
 */
export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });

    if (!user?.steamId) {
        return NextResponse.json({ error: "Steam account not linked" }, { status: 400 });
    }

    if (!STEAM_API_KEY) {
        return NextResponse.json({ error: "Steam API key not configured" }, { status: 500 });
    }

    try {
        // 1. Fetch user's full Steam library
        const libraryUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${user.steamId}&include_appinfo=true&include_played_free_games=true&format=json`;
        const libraryRes = await fetch(libraryUrl);

        if (!libraryRes.ok) {
            return NextResponse.json({ error: "Failed to fetch Steam library. Profile may be private." }, { status: 400 });
        }

        const libraryData = await libraryRes.json();
        const steamGames: SteamGame[] = libraryData.response?.games || [];

        if (steamGames.length === 0) {
            return NextResponse.json({ error: "No games found in Steam library. The library may be private." }, { status: 400 });
        }

        // 2. Batch-fetch IGDB cover art for all games upfront
        const allAppIds = steamGames.map((g) => String(g.appid));
        console.log(`Fetching IGDB covers for ${allAppIds.length} Steam games...`);
        const igdbLookup = await batchFetchIGDBCovers(allAppIds);
        console.log(`Found IGDB data for ${igdbLookup.size} games.`);

        const nowSecs = Math.floor(Date.now() / 1000);
        let imported = 0;
        let achievementsSynced = 0;

        // 3. Import each game
        for (const steamGame of steamGames) {
            try {
                const steamAppId = String(steamGame.appid);
                const igdbData = igdbLookup.get(steamAppId);

                // Prefer IGDB cover; fall back to Steam portrait, then null
                const coverUrl = igdbData?.coverUrl
                    ?? `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/library_600x900.jpg`;

                // Steam hero banner for the game detail page
                const bannerUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppId}/header.jpg`;

                // Determine status from last played time
                const lastPlayedSecs = steamGame.rtime_last_played ?? 0;
                const playedRecently = lastPlayedSecs > 0 && (nowSecs - lastPlayedSecs) <= TWO_WEEKS_SECS;
                const status = playedRecently ? "PLAYING" : "PLANNING";
                const lastPlayedAt = lastPlayedSecs > 0 ? new Date(lastPlayedSecs * 1000) : null;

                const slugBase = slugify(steamGame.name);

                // Find by steamAppId first, then by slug
                let game = await prisma.game.findUnique({ where: { steamAppId } })
                    ?? await prisma.game.findUnique({ where: { slug: slugBase } });

                if (!game) {
                    const slugExists = await prisma.game.findUnique({ where: { slug: slugBase } });
                    const finalSlug = slugExists ? `${slugBase}-${steamAppId}` : slugBase;

                    game = await prisma.game.create({
                        data: {
                            title: steamGame.name,
                            slug: finalSlug,
                            steamAppId,
                            coverUrl,
                            bannerUrl,
                            igdbId: igdbData?.igdbId ?? undefined,
                        },
                    });
                } else {
                    // Update cover/steamAppId/igdbId/bannerUrl if missing
                    const updateData: Record<string, string> = {};
                    if (!game.steamAppId) updateData.steamAppId = steamAppId;
                    if (!game.coverUrl || game.coverUrl.includes("steamstatic")) updateData.coverUrl = coverUrl;
                    if (!game.bannerUrl) updateData.bannerUrl = bannerUrl;
                    if (!game.igdbId && igdbData?.igdbId) updateData.igdbId = igdbData.igdbId;
                    if (Object.keys(updateData).length > 0) {
                        game = await prisma.game.update({ where: { id: game.id }, data: updateData });
                    }
                }

                const playtimeHrs = steamGame.playtime_forever / 60;
                const libraryUpdate: any = { playtimeHrs };
                if (lastPlayedAt) libraryUpdate.lastPlayedAt = lastPlayedAt;

                // Add to user's library (don't overwrite existing user-set status, but DO update playtime + last played)
                await prisma.userGameLibrary.upsert({
                    where: { userId_gameId: { userId: user.id, gameId: game.id } },
                    update: libraryUpdate,
                    create: { userId: user.id, gameId: game.id, status: status as any, playtimeHrs, ...(lastPlayedAt ? { lastPlayedAt } : {}) },
                });
                imported++;

                // Sync achievements
                try {
                    await cacheGlobalAchievements(game.id, steamAppId);
                    await fetchUserAchievements(user.id, user.steamId!, game.id, steamAppId);
                    achievementsSynced++;
                } catch {
                    // Best effort
                }
            } catch {
                // Skip individual game failures silently
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            achievementsSynced,
            message: `Imported ${imported} games with IGDB covers and synced achievements for ${achievementsSynced} of them.`,
        });
    } catch (error: any) {
        console.error("Steam library import error:", error);
        return NextResponse.json({ error: error.message || "Failed to import Steam library" }, { status: 500 });
    }
}
