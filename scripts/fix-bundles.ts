import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getAccessToken() {
    const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        grant_type: 'client_credentials',
    });
    const res = await fetch('https://id.twitch.tv/oauth2/token?'+params, { method: 'POST' });
    const data = await res.json();
    return data.access_token;
}

async function fix() {
    console.log('Starting DB fix...');
    const games = await prisma.game.findMany({ where: { igdbId: { not: null } } });
    console.log('Found ' + games.length + ' games with igdbId');
    if (games.length === 0) return;

    const token = await getAccessToken();
    const STANDALONE = new Set([0, 8, 9, 10, 11]);
    let cleared = 0;

    for (let i = 0; i < games.length; i += 20) {
        const batch = games.slice(i, i + 20);
        const idList = batch.map(g => g.igdbId).join(',');
        const query = 'fields id, category; where id = ('+idList+'); limit 20;';
        
        try {
            const res = await fetch('https://api.igdb.com/v4/games', {
                method: 'POST',
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID!,
                    'Authorization': 'Bearer ' + token,
                },
                body: query
            });
            const data = await res.json();
            const catMap = new Map(data.map((g: any) => [String(g.id), g.category ?? 0]));

            for (const g of batch) {
                const cat = catMap.get(g.igdbId!);
                if (cat === undefined || !STANDALONE.has(cat)) {
                    console.log('Clearing bundle/DLC: ' + g.title + ' (cat=' + cat + ')');
                    await prisma.game.update({ where: { id: g.id }, data: { igdbId: null } });
                    cleared++;
                }
            }
        } catch (e) {
            console.error('Fetch error:', e);
        }
    }
    console.log('Fix complete. Cleared ' + cleared + ' bad igdbIds.');
}
fix().finally(() => prisma.$disconnect());
