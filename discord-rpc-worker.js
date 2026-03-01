/**
 * QuestLog Discord Rich Presence Worker
 *
 * This is a standalone Node.js script that updates Discord Rich Presence
 * with the user's current QuestLog activity.
 *
 * LIMITATION: Browser-based web apps cannot access Discord's IPC socket.
 * This standalone script must run as a local process alongside the browser.
 *
 * Setup:
 *   1. Create a Discord Application at https://discord.com/developers/applications
 *   2. Copy the Application ID into DISCORD_CLIENT_ID below
 *   3. npm install discord-rpc
 *   4. node discord-rpc-worker.js
 *
 * The script polls the QuestLog API every 30 seconds for the current game.
 */

// const DiscordRPC = require("discord-rpc");
// const fetch = require("node-fetch");

const DISCORD_CLIENT_ID = "YOUR_DISCORD_APP_ID_HERE";
const QUESTLOG_API = "http://localhost:3000/api/games";
const POLL_INTERVAL = 30_000; // 30 seconds

/*
async function main() {
  const rpc = new DiscordRPC.Client({ transport: "ipc" });

  rpc.on("ready", () => {
    console.log("✅ Discord RPC connected!");
    updatePresence(rpc);
    setInterval(() => updatePresence(rpc), POLL_INTERVAL);
  });

  rpc.login({ clientId: DISCORD_CLIENT_ID }).catch(console.error);
}

async function updatePresence(rpc) {
  try {
    const res = await fetch(QUESTLOG_API);
    const games = await res.json();

    // Find the currently "PLAYING" game
    const playing = games.find((g) => g.status === "PLAYING");

    if (playing) {
      rpc.setActivity({
        details: `Tracking: ${playing.title}`,
        state: "QuestLog — Game Tracker",
        largeImageKey: "questlog_logo",
        largeImageText: "QuestLog",
        startTimestamp: new Date(),
        instance: false,
      });
    } else {
      rpc.setActivity({
        details: "Browsing QuestLog",
        state: "Discovering new games",
        largeImageKey: "questlog_logo",
        largeImageText: "QuestLog",
        instance: false,
      });
    }
  } catch (err) {
    console.error("Failed to update presence:", err.message);
  }
}

main();
*/

console.log(`
╔══════════════════════════════════════════════════════════════╗
║              QuestLog Discord RPC Worker                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  This script updates Discord Rich Presence with your         ║
║  current QuestLog activity.                                  ║
║                                                              ║
║  To enable:                                                  ║
║  1. Install discord-rpc: npm install discord-rpc             ║
║  2. Set your DISCORD_CLIENT_ID in this file                  ║
║  3. Uncomment the code above                                 ║
║  4. Run: node discord-rpc-worker.js                          ║
║                                                              ║
║  NOTE: Browser apps cannot access Discord IPC directly.      ║
║  This worker runs as a separate process.                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
