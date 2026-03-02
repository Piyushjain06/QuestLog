const IGDB_BASE = 'https://api.igdb.com/v4';
const TWITCH_OAUTH_URL = 'https://id.twitch.tv/oauth2/token';
const clientId = 'msc5l0vwyo36qegvhxvj9mri5nd0ao';
const clientSecret = 'arynuggbk70ehstjzwcbnv11i87odl';

async function test() {
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
    });
    const authRes = await fetch(TWITCH_OAUTH_URL + '?' + params, { method: 'POST' });
    const authData = await authRes.json();
    const token = authData.access_token;
    console.log("Token:", token ? "OK" : "Failed");

    const query = `
        search "zelda";
        fields name, summary, first_release_date, total_rating, genres.name, involved_companies.developer, involved_companies.publisher, involved_companies.company.name, platforms.name, cover.image_id;
        where version_parent = null;
        limit 20;
        offset 0;
    `;

    const res = await fetch(`${IGDB_BASE}/games`, {
        method: 'POST',
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'text/plain',
        },
        body: query,
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
}
test().catch(console.error);
