import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { fetchSteamAppIdFromIGDB, cacheGlobalAchievements, fetchUserAchievements } from '../src/lib/steamTracker';
import { prisma } from '../src/lib/prisma';

async function main() {
    console.log("Starting Steam Bridge Test...");

    try {
        // 1. Create a dummy user and game
        const testUser = await prisma.user.upsert({
            where: { email: 'steamtest@example.com' },
            update: { steamId: '76561198028121353' }, // A random public profile, or fallback
            create: {
                email: 'steamtest@example.com',
                name: 'Steam Test User',
                steamId: '76561198028121353',
            }
        });

        const testGame = await prisma.game.upsert({
            where: { slug: 'half-life-2' },
            update: { igdbId: '43' }, // Half-Life 2 IGDB ID is 43
            create: {
                title: 'Half-Life 2',
                slug: 'half-life-2',
                igdbId: '43',
            }
        });

        console.log(`Created test user: ${testUser.id} and game: ${testGame.id}`);

        // 2. Fetch App ID
        console.log(`Fetching Steam App ID for IGDB ID 43...`);
        const steamAppId = await fetchSteamAppIdFromIGDB("43");
        console.log(`Resolved Steam App ID: ${steamAppId}`);

        if (!steamAppId) {
            console.error("Failed to resolve Steam App ID. The IGDB bridge might not be working.");
            return;
        }

        // 3. Cache Global Achievements
        console.log(`Caching global achievements for Steam App ID ${steamAppId}...`);
        await cacheGlobalAchievements(testGame.id, steamAppId);
        
        // Verify Cache
        const count = await prisma.achievement.count({ where: { gameId: testGame.id }});
        console.log(`Cached ${count} global achievements in local database.`);

        // 4. Fetch User Achievements
        console.log(`Fetching user achievements for Steam ID ${testUser.steamId}...`);
        await fetchUserAchievements(testUser.id, testUser.steamId!, testGame.id, steamAppId);

        // Verify User Achievements
        const userAchCount = await prisma.userAchievement.count({ 
            where: { 
                userId: testUser.id, 
                achievement: { gameId: testGame.id } 
            }
        });
        console.log(`User has unlocked ${userAchCount} achievements saved to DB.`);

        console.log("Steam tracking bridge fully working!");
    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
