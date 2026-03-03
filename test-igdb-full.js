const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim();
});

const IGDB_BASE = "https://api.igdb.com/v4";
const TWITCH_OAUTH_URL = "https://id.twitch.tv/oauth2/token";

async function run() {
    const clientId = env['TWITCH_CLIENT_ID'];
    const clientSecret = env['TWITCH_CLIENT_SECRET'];

    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
    });

    const tokenRes = await fetch(`${TWITCH_OAUTH_URL}?${params}`, { method: "POST" });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;

    const query = `
        fields *;
        where id = 1942;
    `;

    const res = await fetch(`${IGDB_BASE}/games`, {
        method: "POST",
        headers: {
            "Client-ID": clientId,
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "text/plain",
        },
        body: query,
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

run();
