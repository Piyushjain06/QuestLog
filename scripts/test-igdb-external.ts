import { fetchIGDB } from '../src/lib/igdb';

async function main() {
    console.log("Testing IGDB External Games endpoint...");
    const igdbId = 43; // Half-Life 2
    
    // First let's just see if we can fetch the game itself
    const game = await fetchIGDB("games", `fields name, external_games; where id = ${igdbId};`);
    console.log("Game:", JSON.stringify(game, null, 2));

    const externalGamesIds = game[0]?.external_games;
    if (externalGamesIds) {
        const ext = await fetchIGDB("external_games", `fields uid, category; where id = (${externalGamesIds.join(",")});`);
        console.log("External Games:", JSON.stringify(ext, null, 2));
    } else {
        console.log("No external_games field returned.");
    }
}

main().catch(console.error);
