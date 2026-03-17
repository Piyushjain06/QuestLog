/** @type {import('next').NextConfig} */
const nextConfig = {
    // Increase header buffer — pairs with --max-http-header-size=16384 in dev script
    // Goal: diagnose + fix bloated cookies; keep prod headers under 8KB
    images: {
        remotePatterns: [
            { protocol: "https", hostname: "cdn.akamai.steamstatic.com" },
            { protocol: "https", hostname: "steamcdn-a.akamaihd.net" },
            { protocol: "https", hostname: "shared.akamai.steamstatic.com" },
            { protocol: "https", hostname: "media.rawg.io" },
            { protocol: "https", hostname: "lh3.googleusercontent.com" },
            { protocol: "https", hostname: "avatars.steamstatic.com" },
            { protocol: "https", hostname: "avatars.akamai.steamstatic.com" },
            { protocol: "https", hostname: "cdn.thegamesdb.net" },
            { protocol: "https", hostname: "images.igdb.com" },
        ],
    },
};

module.exports = nextConfig;
