import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { fetchSteamAppIdFromIGDB } from '../src/lib/steamTracker';

async function main() {
    console.log("Fetching Steam App ID for IGDB ID 43...");
    const steamAppId = await fetchSteamAppIdFromIGDB("43");
    console.log(`Result:`, steamAppId);
}
main().catch(console.error);
