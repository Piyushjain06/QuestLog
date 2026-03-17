import { fetchIGDB } from "./igdb";
import { prisma } from "./prisma";

const STEAM_API_KEY = process.env.STEAM_API_KEY;

export interface SteamAchievementSchema {
    name: string;
    defaultvalue: number;
    displayName: string;
    hidden: number;
    description?: string;
    icon: string;
    icongray: string;
}

export interface SteamPlayerAchievement {
    apiname: string;
    achieved: number;
    unlocktime: number;
}

/**
 * 1. fetchSteamAppIdFromIGDB
 * Looks up the Steam App ID for a given IGDB game ID and saves it to the database.
 */
export async function fetchSteamAppIdFromIGDB(igdbIdStr: string): Promise<string | null> {
    const igdbId = parseInt(igdbIdStr, 10);
    if (isNaN(igdbId)) return null;

    // Check database first
    const existingGame = await prisma.game.findUnique({
        where: { igdbId: igdbIdStr },
        select: { id: true, steamAppId: true },
    });

    if (existingGame?.steamAppId) {
        return existingGame.steamAppId;
    }

    const query = `fields uid, url; where game = ${igdbId}; limit 50;`;

    try {
        const results = await fetchIGDB("external_games", query);
        if (results && results.length > 0) {
            const steamGame = results.find((r: any) => r.url?.includes("steampowered.com"));
            
            if (steamGame?.uid) {
                const steamAppId = steamGame.uid;
                
                if (existingGame) {
                    await prisma.game.update({
                        where: { id: existingGame.id },
                        data: { steamAppId },
                    });
                }
                
                return steamAppId;
            }
        }
    } catch (error) {
        console.error("Error fetching Steam App ID from IGDB:", error);
    }

    return null;
}

/**
 * 2. cacheGlobalAchievements
 * Fetches the master list of achievements for a game from Steam and caches them in the database.
 */
export async function cacheGlobalAchievements(gameId: string, steamAppId: string): Promise<void> {
    if (!STEAM_API_KEY) {
        console.error("STEAM_API_KEY is not set.");
        return;
    }

    try {
        // Check if we already have achievements cached for this game
        const existingCount = await prisma.achievement.count({
            where: { gameId },
        });

        if (existingCount > 0) {
            return; // Already cached
        }

        const url = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${steamAppId}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error(`Failed to fetch Steam schema for ${steamAppId}: ${response.statusText}`);
            return;
        }

        const data = await response.json();
        const achievements: SteamAchievementSchema[] = data.game?.availableGameStats?.achievements || [];

        if (achievements.length > 0) {
            // Bulk insert
            await prisma.achievement.createMany({
                data: achievements.map((ach) => ({
                    gameId,
                    name: ach.name,
                    displayName: ach.displayName,
                    description: ach.description || null,
                    iconUrl: ach.icon || null,
                    iconGrayUrl: ach.icongray || null,
                    hidden: ach.hidden === 1,
                })),
                skipDuplicates: true,
            });
            console.log(`Cached ${achievements.length} global achievements for game ${gameId}`);
        }
    } catch (error) {
        console.error("Error caching global achievements:", error);
    }
}

/**
 * 3. Fetch user's achievements and update db
 */
export async function fetchUserAchievements(userId: string, steamId: string, gameId: string, steamAppId: string): Promise<void> {
    try {
        if (!STEAM_API_KEY) throw new Error("STEAM_API_KEY is not defined");

        // Use GetPlayerAchievements
        const url = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${steamAppId}&key=${STEAM_API_KEY}&steamid=${steamId}`;
        const res = await fetch(url);
        
        if (!res.ok) {
            // Profile private or game not owned
            console.warn(`Could not fetch player achievements for ${steamId} on app ${steamAppId}`);
            return;
        }

        const data = await res.json();
        const playerAchievements: SteamPlayerAchievement[] = data.playerstats?.achievements || [];

        // Filter only those that are unlocked
        const unlocked = playerAchievements.filter(ach => ach.achieved === 1);

        if (unlocked.length > 0) {
            // Get database mapping from Steam's api name to our Achievement ID
            const dbAchievements = await prisma.achievement.findMany({
                where: { gameId },
                select: { id: true, name: true }
            });

            const gameAchNameSet = new Set(dbAchievements.map((a: { name: string }) => a.name));

            const nameToIdMap = new Map(dbAchievements.map(a => [a.name, a.id]));

            const payload = unlocked
                .filter(ach => nameToIdMap.has(ach.apiname))
                .map(ach => ({
                    userId,
                    achievementId: nameToIdMap.get(ach.apiname)!,
                    unlockedAt: new Date(ach.unlocktime * 1000), // Steam returns Unix timestamp in seconds
                }));

            if (payload.length > 0) {
                // NextAuth/Prisma createMany is good here
                await prisma.userAchievement.createMany({
                    data: payload,
                    skipDuplicates: true, // Prevents errors if we refetch later
                });
            }
        }

    } catch (error) {
        console.error("Error fetching user achievements:", error);
    }
}
