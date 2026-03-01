import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const games = [
    {
        title: "Elden Ring",
        slug: "elden-ring",
        description: "An action RPG set in the Lands Between, a vast world created by Hidetaka Miyazaki and George R.R. Martin.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg",
        steamAppId: "1245620",
        genres: ["Action", "RPG", "Open World"],
        tags: ["Souls-like", "Dark Fantasy", "Difficult", "Exploration", "Boss Rush"],
        platforms: ["PC", "PlayStation", "Xbox"],
        developer: "FromSoftware",
        publisher: "Bandai Namco",
        releaseDate: "Feb 25, 2022",
        rating: 9.2,
    },
    {
        title: "Dark Souls III",
        slug: "dark-souls-iii",
        description: "The final entry in the Dark Souls trilogy. Prepare to die again in this challenging action RPG.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/374320/header.jpg",
        steamAppId: "374320",
        genres: ["Action", "RPG"],
        tags: ["Souls-like", "Dark Fantasy", "Difficult", "Co-op", "Gothic"],
        platforms: ["PC", "PlayStation", "Xbox"],
        developer: "FromSoftware",
        publisher: "Bandai Namco",
        releaseDate: "Apr 12, 2016",
        rating: 9.0,
    },
    {
        title: "Lies of P",
        slug: "lies-of-p",
        description: "A Souls-like inspired by the story of Pinocchio. Explore the dark Belle Époque city of Krat.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1627720/header.jpg",
        steamAppId: "1627720",
        genres: ["Action", "RPG"],
        tags: ["Souls-like", "Dark Fantasy", "Difficult", "Story Rich", "Gothic"],
        platforms: ["PC", "PlayStation", "Xbox"],
        developer: "Neowiz Games",
        publisher: "Neowiz",
        releaseDate: "Sep 19, 2023",
        rating: 8.5,
    },
    {
        title: "The Witcher 3: Wild Hunt",
        slug: "the-witcher-3-wild-hunt",
        description: "Embark on an epic journey as Geralt of Rivia, hunting monsters and making world-shaping choices.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
        steamAppId: "292030",
        genres: ["RPG", "Open World", "Adventure"],
        tags: ["Story Rich", "Dark Fantasy", "Choices Matter", "Exploration", "Mature"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "CD Projekt Red",
        publisher: "CD Projekt",
        releaseDate: "May 19, 2015",
        rating: 9.5,
    },
    {
        title: "Cyberpunk 2077",
        slug: "cyberpunk-2077",
        description: "An open-world RPG set in Night City, a megalopolis obsessed with power, glamour, and body modification.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
        steamAppId: "1091500",
        genres: ["RPG", "Open World", "Shooter"],
        tags: ["Cyberpunk", "Story Rich", "Choices Matter", "FPS", "Futuristic"],
        platforms: ["PC", "PlayStation", "Xbox"],
        developer: "CD Projekt Red",
        publisher: "CD Projekt",
        releaseDate: "Dec 10, 2020",
        rating: 8.6,
    },
    {
        title: "Baldur's Gate 3",
        slug: "baldurs-gate-3",
        description: "A story-rich RPG set in the Forgotten Realms. Gather your party and earn your place in legend.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg",
        steamAppId: "1086940",
        genres: ["RPG", "Strategy", "Adventure"],
        tags: ["Turn-Based", "Story Rich", "Co-op", "D&D", "Choices Matter"],
        platforms: ["PC", "PlayStation", "Xbox"],
        developer: "Larian Studios",
        publisher: "Larian Studios",
        releaseDate: "Aug 3, 2023",
        rating: 9.6,
    },
    {
        title: "Hollow Knight",
        slug: "hollow-knight",
        description: "Forge your own path in this vast, hand-drawn kingdom of insects and heroes.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg",
        steamAppId: "367520",
        genres: ["Action", "Platformer", "Indie"],
        tags: ["Metroidvania", "Dark Fantasy", "Difficult", "Exploration", "2D"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "Team Cherry",
        publisher: "Team Cherry",
        releaseDate: "Feb 24, 2017",
        rating: 9.3,
    },
    {
        title: "Celeste",
        slug: "celeste",
        description: "Help Madeline survive inner demons on her journey to the top of Celeste Mountain.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/504230/header.jpg",
        steamAppId: "504230",
        genres: ["Platformer", "Indie"],
        tags: ["Difficult", "Pixel Graphics", "Story Rich", "Precision Platformer", "2D"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "Maddy Makes Games",
        publisher: "Maddy Makes Games",
        releaseDate: "Jan 25, 2018",
        rating: 9.1,
    },
    {
        title: "Hades",
        slug: "hades",
        description: "Defy the god of the dead as you hack and slash your way out of the Underworld.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1145360/header.jpg",
        steamAppId: "1145360",
        genres: ["Action", "RPG", "Indie"],
        tags: ["Roguelike", "Story Rich", "Greek Mythology", "Fast-Paced", "Hack and Slash"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "Supergiant Games",
        publisher: "Supergiant Games",
        releaseDate: "Sep 17, 2020",
        rating: 9.4,
    },
    {
        title: "Stardew Valley",
        slug: "stardew-valley",
        description: "Build the farm of your dreams in this charming farming simulation RPG.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/413150/header.jpg",
        steamAppId: "413150",
        genres: ["Simulation", "RPG", "Indie"],
        tags: ["Farming", "Relaxing", "Pixel Graphics", "Co-op", "Life Sim"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch", "Mobile"],
        developer: "ConcernedApe",
        publisher: "ConcernedApe",
        releaseDate: "Feb 26, 2016",
        rating: 9.5,
    },
    {
        title: "God of War",
        slug: "god-of-war",
        description: "Kratos returns. Living as a man outside the shadow of the gods, he ventures into Norse mythology.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg",
        steamAppId: "1593500",
        genres: ["Action", "Adventure"],
        tags: ["Story Rich", "Mythology", "Hack and Slash", "Third Person", "Boss Rush"],
        platforms: ["PC", "PlayStation"],
        developer: "Santa Monica Studio",
        publisher: "PlayStation PC LLC",
        releaseDate: "Jan 14, 2022",
        rating: 9.3,
    },
    {
        title: "Sekiro: Shadows Die Twice",
        slug: "sekiro-shadows-die-twice",
        description: "Carve your own path to vengeance in this award-winning action-adventure from FromSoftware.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/814380/header.jpg",
        steamAppId: "814380",
        genres: ["Action", "Adventure"],
        tags: ["Souls-like", "Difficult", "Ninja", "Japanese", "Stealth"],
        platforms: ["PC", "PlayStation", "Xbox"],
        developer: "FromSoftware",
        publisher: "Activision",
        releaseDate: "Mar 22, 2019",
        rating: 9.0,
    },
    {
        title: "Disco Elysium",
        slug: "disco-elysium",
        description: "A groundbreaking RPG where you solve a murder case. Build your skills and shape your character.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/632470/header.jpg",
        steamAppId: "632470",
        genres: ["RPG", "Adventure"],
        tags: ["Story Rich", "Choices Matter", "Detective", "Atmospheric", "Dialogue Heavy"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "ZA/UM",
        publisher: "ZA/UM",
        releaseDate: "Oct 15, 2019",
        rating: 9.2,
    },
    {
        title: "Terraria",
        slug: "terraria",
        description: "Dig, fight, explore, build. In this action-packed adventure, the world is your canvas.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg",
        steamAppId: "105600",
        genres: ["Action", "Sandbox", "Adventure"],
        tags: ["Crafting", "2D", "Co-op", "Survival", "Exploration"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch", "Mobile"],
        developer: "Re-Logic",
        publisher: "Re-Logic",
        releaseDate: "May 16, 2011",
        rating: 9.5,
    },
    {
        title: "Red Dead Redemption 2",
        slug: "red-dead-redemption-2",
        description: "An epic tale of life in America's unforgiving heartland. Arthur Morgan and the Van der Linde gang.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg",
        steamAppId: "1174180",
        genres: ["Action", "Adventure", "Open World"],
        tags: ["Story Rich", "Western", "Third Person", "Atmospheric", "Mature"],
        platforms: ["PC", "PlayStation", "Xbox"],
        developer: "Rockstar Games",
        publisher: "Rockstar Games",
        releaseDate: "Dec 5, 2019",
        rating: 9.4,
    },
    {
        title: "Doom Eternal",
        slug: "doom-eternal",
        description: "Rip and tear through hordes of demons in this fast-paced, high-octane FPS.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/782330/header.jpg",
        steamAppId: "782330",
        genres: ["Action", "Shooter"],
        tags: ["FPS", "Fast-Paced", "Demons", "Gore", "Difficult"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "id Software",
        publisher: "Bethesda Softworks",
        releaseDate: "Mar 20, 2020",
        rating: 8.9,
    },
    {
        title: "Persona 5 Royal",
        slug: "persona-5-royal",
        description: "Enter the Metaverse in this definitive edition of the award-winning JRPG.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1687950/header.jpg",
        steamAppId: "1687950",
        genres: ["RPG", "Adventure"],
        tags: ["JRPG", "Turn-Based", "Story Rich", "Anime", "Life Sim"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "Atlus",
        publisher: "SEGA",
        releaseDate: "Oct 21, 2022",
        rating: 9.3,
    },
    {
        title: "Monster Hunter: World",
        slug: "monster-hunter-world",
        description: "Take on the role of a hunter and slay ferocious monsters in a living, breathing ecosystem.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/582010/header.jpg",
        steamAppId: "582010",
        genres: ["Action", "RPG", "Co-op"],
        tags: ["Hunting", "Co-op", "Open World", "Crafting", "Boss Rush"],
        platforms: ["PC", "PlayStation", "Xbox"],
        developer: "Capcom",
        publisher: "Capcom",
        releaseDate: "Aug 9, 2018",
        rating: 8.8,
    },
    {
        title: "Subnautica",
        slug: "subnautica",
        description: "Descend into the depths of an alien underwater world filled with wonder and peril.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/264710/header.jpg",
        steamAppId: "264710",
        genres: ["Adventure", "Survival"],
        tags: ["Open World", "Exploration", "Crafting", "Underwater", "Base Building"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "Unknown Worlds",
        publisher: "Unknown Worlds",
        releaseDate: "Jan 23, 2018",
        rating: 9.1,
    },
    {
        title: "Outer Wilds",
        slug: "outer-wilds",
        description: "Explore a hand-crafted solar system stuck in an endless time loop. A space exploration mystery.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/753640/header.jpg",
        steamAppId: "753640",
        genres: ["Adventure", "Indie", "Puzzle"],
        tags: ["Exploration", "Space", "Mystery", "Atmospheric", "Time Loop"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "Mobius Digital",
        publisher: "Annapurna Interactive",
        releaseDate: "Jun 18, 2020",
        rating: 9.3,
    },
    {
        title: "Civilization VI",
        slug: "civilization-vi",
        description: "Build an empire to stand the test of time in the latest entry of the legendary strategy franchise.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/289070/header.jpg",
        steamAppId: "289070",
        genres: ["Strategy", "Simulation"],
        tags: ["Turn-Based", "4X", "Historical", "City Builder", "Multiplayer"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch", "Mobile"],
        developer: "Firaxis Games",
        publisher: "2K Games",
        releaseDate: "Oct 21, 2016",
        rating: 8.5,
    },
    {
        title: "Horizon Zero Dawn",
        slug: "horizon-zero-dawn",
        description: "Unravel the mysteries of a world ruled by machines. Explore tribal lands and ancient ruins.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1151640/header.jpg",
        steamAppId: "1151640",
        genres: ["Action", "RPG", "Open World"],
        tags: ["Sci-Fi", "Story Rich", "Third Person", "Post-Apocalyptic", "Exploration"],
        platforms: ["PC", "PlayStation"],
        developer: "Guerrilla Games",
        publisher: "PlayStation PC LLC",
        releaseDate: "Aug 7, 2020",
        rating: 8.8,
    },
    {
        title: "NieR: Automata",
        slug: "nier-automata",
        description: "An existential action RPG about androids fighting a proxy war against machine lifeforms.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/524220/header.jpg",
        steamAppId: "524220",
        genres: ["Action", "RPG"],
        tags: ["Story Rich", "Sci-Fi", "Hack and Slash", "Anime", "Philosophical"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "PlatinumGames",
        publisher: "Square Enix",
        releaseDate: "Mar 17, 2017",
        rating: 9.0,
    },
    {
        title: "Valheim",
        slug: "valheim",
        description: "A brutal exploration and survival game inspired by Viking culture and Norse mythology.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/892970/header.jpg",
        steamAppId: "892970",
        genres: ["Survival", "Adventure"],
        tags: ["Viking", "Co-op", "Crafting", "Base Building", "Open World"],
        platforms: ["PC", "Xbox"],
        developer: "Iron Gate AB",
        publisher: "Coffee Stain Publishing",
        releaseDate: "Feb 2, 2021",
        rating: 8.7,
    },
    {
        title: "Returnal",
        slug: "returnal",
        description: "Break the cycle in this roguelike third-person shooter set on an ever-changing alien planet.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1649240/header.jpg",
        steamAppId: "1649240",
        genres: ["Action", "Shooter"],
        tags: ["Roguelike", "Sci-Fi", "Difficult", "Third Person", "Bullet Hell"],
        platforms: ["PC", "PlayStation"],
        developer: "Housemarque",
        publisher: "PlayStation PC LLC",
        releaseDate: "Feb 15, 2023",
        rating: 8.4,
    },
    {
        title: "It Takes Two",
        slug: "it-takes-two",
        description: "Embark on the craziest journey of your life in this genre-bending co-op adventure.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1426210/header.jpg",
        steamAppId: "1426210",
        genres: ["Adventure", "Platformer"],
        tags: ["Co-op", "Split Screen", "Story Rich", "Puzzle", "Family"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch"],
        developer: "Hazelight Studios",
        publisher: "Electronic Arts",
        releaseDate: "Mar 26, 2021",
        rating: 9.0,
    },
    {
        title: "Death Stranding",
        slug: "death-stranding",
        description: "Traverse a ravaged world to reconnect isolated cities and restore hope in Hideo Kojima's masterpiece.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1190460/header.jpg",
        steamAppId: "1190460",
        genres: ["Action", "Adventure", "Open World"],
        tags: ["Story Rich", "Atmospheric", "Walking Simulator", "Sci-Fi", "Philosophical"],
        platforms: ["PC", "PlayStation"],
        developer: "Kojima Productions",
        publisher: "505 Games",
        releaseDate: "Jul 14, 2020",
        rating: 8.0,
    },
    {
        title: "Factorio",
        slug: "factorio",
        description: "Automate everything. Build and maintain massive factories in this factory-building sim.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/427520/header.jpg",
        steamAppId: "427520",
        genres: ["Strategy", "Simulation", "Indie"],
        tags: ["Automation", "Base Building", "Crafting", "Resource Management", "Co-op"],
        platforms: ["PC", "Switch"],
        developer: "Wube Software",
        publisher: "Wube Software",
        releaseDate: "Aug 14, 2020",
        rating: 9.7,
    },
    {
        title: "Titanfall 2",
        slug: "titanfall-2",
        description: "Call in your Titan and join the frontier militia in one of the best FPS campaigns ever made.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1237970/header.jpg",
        steamAppId: "1237970",
        genres: ["Action", "Shooter"],
        tags: ["FPS", "Sci-Fi", "Mech", "Fast-Paced", "Multiplayer"],
        platforms: ["PC", "PlayStation", "Xbox"],
        developer: "Respawn Entertainment",
        publisher: "Electronic Arts",
        releaseDate: "Oct 28, 2016",
        rating: 9.0,
    },
    {
        title: "Slay the Spire",
        slug: "slay-the-spire",
        description: "Craft a unique deck, encounter bizarre creatures, and ascend the Spire in this deckbuilding roguelike.",
        coverUrl: "https://cdn.akamai.steamstatic.com/steam/apps/646570/header.jpg",
        steamAppId: "646570",
        genres: ["Strategy", "RPG", "Indie"],
        tags: ["Roguelike", "Card Game", "Turn-Based", "Deckbuilder", "Difficult"],
        platforms: ["PC", "PlayStation", "Xbox", "Switch", "Mobile"],
        developer: "Mega Crit Games",
        publisher: "Mega Crit Games",
        releaseDate: "Jan 23, 2019",
        rating: 9.2,
    },
];

// Missions for Elden Ring (as demo)
const eldenRingMissions = [
    { title: "Defeat Margit, the Fell Omen", description: "The first major demigod boss guards access to Stormveil Castle.", type: "MAIN", difficulty: "HARD", xpReward: 500, orderIndex: 1 },
    { title: "Defeat Godrick the Grafted", description: "The Lord of Stormveil Castle must fall before you can proceed.", type: "MAIN", difficulty: "HARD", xpReward: 750, orderIndex: 2 },
    { title: "Reach the Roundtable Hold", description: "Discover the hub of Tarnished warriors and NPCs.", type: "MAIN", difficulty: "EASY", xpReward: 200, orderIndex: 3 },
    { title: "Obtain the Moonveil Katana", description: "Find this powerful INT-scaling weapon in Gael Tunnel.", type: "SIDE", difficulty: "MEDIUM", xpReward: 300, orderIndex: 4 },
    { title: "Defeat Rennala, Queen of the Full Moon", description: "The second major demigod awaits in the Academy of Raya Lucaria.", type: "MAIN", difficulty: "MEDIUM", xpReward: 750, orderIndex: 5 },
    { title: "Explore Siofra River", description: "Discover the underground realm beneath Mistwood.", type: "SIDE", difficulty: "MEDIUM", xpReward: 400, orderIndex: 6 },
    { title: "Defeat Starscourge Radahn", description: "Join the Radahn Festival and defeat the mightiest demigod.", type: "MAIN", difficulty: "HARD", xpReward: 1000, orderIndex: 7 },
    { title: "Find All Map Fragments", description: "Collect every map stele to reveal the Lands Between.", type: "COLLECTIBLE", difficulty: "EASY", xpReward: 600, orderIndex: 8 },
    { title: "Complete Ranni's Questline", description: "Follow the mysterious witch's questline to its conclusion.", type: "SIDE", difficulty: "HARD", xpReward: 800, orderIndex: 9 },
    { title: "Defeat the Elden Beast", description: "Face the final boss and become Elden Lord.", type: "MAIN", difficulty: "HARD", xpReward: 2000, orderIndex: 10 },
];

// Missions for Hollow Knight
const hollowKnightMissions = [
    { title: "Defeat the False Knight", description: "The first boss guards the city entrance.", type: "MAIN", difficulty: "EASY", xpReward: 200, orderIndex: 1 },
    { title: "Obtain the Mantis Claw", description: "Gain the wall-jump ability in the Mantis Village.", type: "MAIN", difficulty: "MEDIUM", xpReward: 300, orderIndex: 2 },
    { title: "Defeat the Mantis Lords", description: "Prove your worth to the Mantis Tribe.", type: "MAIN", difficulty: "HARD", xpReward: 500, orderIndex: 3 },
    { title: "Explore the Crystal Peaks", description: "Navigate the crystalline caverns above Forgotten Crossroads.", type: "SIDE", difficulty: "MEDIUM", xpReward: 250, orderIndex: 4 },
    { title: "Get the Dream Nail", description: "Acquire this mysterious tool from the Resting Grounds.", type: "MAIN", difficulty: "EASY", xpReward: 400, orderIndex: 5 },
    { title: "Defeat Hornet in Greenpath", description: "Face the nimble protector of Greenpath.", type: "MAIN", difficulty: "MEDIUM", xpReward: 300, orderIndex: 6 },
    { title: "Collect All Grubs", description: "Rescue every lost grub hidden throughout Hallownest.", type: "COLLECTIBLE", difficulty: "HARD", xpReward: 800, orderIndex: 7 },
    { title: "Defeat the Hollow Knight", description: "Face the Hollow Knight in the Black Egg Temple.", type: "MAIN", difficulty: "HARD", xpReward: 1500, orderIndex: 8 },
];

// Missions for Hades  
const hadesMissions = [
    { title: "Escape Tartarus", description: "Clear the first biome and defeat the Fury.", type: "MAIN", difficulty: "MEDIUM", xpReward: 200, orderIndex: 1 },
    { title: "Clear Asphodel", description: "Navigate the lava-filled second biome.", type: "MAIN", difficulty: "MEDIUM", xpReward: 300, orderIndex: 2 },
    { title: "Defeat the Bone Hydra", description: "Slay the fearsome boss of Asphodel.", type: "MAIN", difficulty: "MEDIUM", xpReward: 400, orderIndex: 3 },
    { title: "Clear Elysium", description: "Battle through the third biome's elite warriors.", type: "MAIN", difficulty: "HARD", xpReward: 400, orderIndex: 4 },
    { title: "Defeat Theseus and Asterius", description: "Face the champions of Elysium.", type: "MAIN", difficulty: "HARD", xpReward: 600, orderIndex: 5 },
    { title: "Escape the Underworld", description: "Defeat Hades and reach the surface for the first time.", type: "MAIN", difficulty: "HARD", xpReward: 1000, orderIndex: 6 },
    { title: "Complete 10 Escape Attempts", description: "Complete ten successful escapes to see the true ending.", type: "ACHIEVEMENT", difficulty: "HARD", xpReward: 2000, orderIndex: 7 },
    { title: "Max Bond with Thanatos", description: "Deepen your relationship with the personification of Death.", type: "SIDE", difficulty: "MEDIUM", xpReward: 300, orderIndex: 8 },
];

async function main() {
    console.log("🎮 Seeding QuestLog database...\n");

    // Create demo user
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await prisma.user.upsert({
        where: { email: "gamer@questlog.dev" },
        update: { password: hashedPassword },
        create: {
            email: "gamer@questlog.dev",
            name: "QuestLog Gamer",
            image: null,
            password: hashedPassword,
        },
    });
    console.log(`✅ Created user: ${user.name} (password: password123)`);

    // Seed all games
    const createdGames: Record<string, string> = {};
    for (const game of games) {
        const created = await prisma.game.upsert({
            where: { slug: game.slug },
            update: {},
            create: {
                title: game.title,
                slug: game.slug,
                description: game.description,
                coverUrl: game.coverUrl,
                steamAppId: game.steamAppId,
                genres: JSON.stringify(game.genres),
                tags: JSON.stringify(game.tags),
                platforms: JSON.stringify(game.platforms),
                developer: game.developer,
                publisher: game.publisher,
                releaseDate: game.releaseDate,
                rating: game.rating,
            },
        });
        createdGames[game.slug] = created.id;
    }
    console.log(`✅ Seeded ${games.length} games`);

    // Add some games to user's library
    const libraryGames = [
        { slug: "elden-ring", status: "PLAYING", playtimeHrs: 87.5, userRating: 5 },
        { slug: "hollow-knight", status: "COMPLETED", playtimeHrs: 62.3, userRating: 4.5 },
        { slug: "hades", status: "COMPLETED", playtimeHrs: 45.2, userRating: 4.5 },
        { slug: "the-witcher-3-wild-hunt", status: "COMPLETED", playtimeHrs: 142.0, userRating: 5 },
        { slug: "cyberpunk-2077", status: "PLAYING", playtimeHrs: 35.7, userRating: 4 },
        { slug: "baldurs-gate-3", status: "PLAYING", playtimeHrs: 120.0, userRating: 5 },
        { slug: "celeste", status: "COMPLETED", playtimeHrs: 18.5, userRating: 4.5 },
        { slug: "stardew-valley", status: "BACKLOG", playtimeHrs: 5.2, userRating: null },
        { slug: "doom-eternal", status: "DROPPED", playtimeHrs: 12.0, userRating: 3.5 },
        { slug: "red-dead-redemption-2", status: "BACKLOG", playtimeHrs: 0, userRating: null },
    ];

    for (const entry of libraryGames) {
        const gameId = createdGames[entry.slug];
        if (gameId) {
            await prisma.userGameLibrary.upsert({
                where: { userId_gameId: { userId: user.id, gameId } },
                update: {},
                create: {
                    userId: user.id,
                    gameId,
                    status: entry.status,
                    playtimeHrs: entry.playtimeHrs,
                    userRating: entry.userRating,
                    startedAt: entry.playtimeHrs > 0 ? new Date("2024-01-15") : null,
                    completedAt: entry.status === "COMPLETED" ? new Date("2024-06-01") : null,
                },
            });
        }
    }
    console.log(`✅ Added ${libraryGames.length} games to user library`);

    // Seed missions
    const eldenRingId = createdGames["elden-ring"];
    const hollowKnightId = createdGames["hollow-knight"];
    const hadesId = createdGames["hades"];

    if (eldenRingId) {
        for (const mission of eldenRingMissions) {
            await prisma.mission.create({
                data: { gameId: eldenRingId, ...mission },
            });
        }
        console.log(`✅ Added ${eldenRingMissions.length} missions for Elden Ring`);
    }

    if (hollowKnightId) {
        for (const mission of hollowKnightMissions) {
            await prisma.mission.create({
                data: { gameId: hollowKnightId, ...mission },
            });
        }
        console.log(`✅ Added ${hollowKnightMissions.length} missions for Hollow Knight`);
    }

    if (hadesId) {
        for (const mission of hadesMissions) {
            await prisma.mission.create({
                data: { gameId: hadesId, ...mission },
            });
        }
        console.log(`✅ Added ${hadesMissions.length} missions for Hades`);
    }

    // Optional: Enrich games with TheGamesDB data
    const tgdbKey = process.env.TGDB_API_KEY;
    if (tgdbKey) {
        console.log("\n🔗 TGDB API key found — enriching games with TheGamesDB data...");
        const TGDB_BASE = "https://api.thegamesdb.net";
        let enriched = 0;

        for (const game of games) {
            try {
                const params = new URLSearchParams({
                    apikey: tgdbKey,
                    name: game.title,
                    fields: "overview,genres,publishers",
                    include: "boxart",
                });
                const res = await fetch(`${TGDB_BASE}/v1.1/Games/ByGameName?${params}`);
                const json = await res.json();

                if (json.data?.games?.length > 0) {
                    const tgdbGame = json.data.games[0];
                    const imageBase = json.include?.boxart?.base_url?.original ?? "";
                    const boxarts = json.include?.boxart?.data?.[String(tgdbGame.id)] ?? [];
                    const front = boxarts.find((b: { side?: string }) => b.side === "front");
                    const coverUrl = front
                        ? `${imageBase.replace("/original/", "/medium/")}${front.filename}`
                        : undefined;

                    await prisma.game.update({
                        where: { slug: game.slug },
                        data: {
                            tgdbId: String(tgdbGame.id),
                            ...(coverUrl ? { coverUrl } : {}),
                        },
                    });
                    enriched++;
                }

                // Rate limit: ~200ms between requests
                await new Promise((r) => setTimeout(r, 200));
            } catch {
                // Skip on error — TGDB enrichment is optional
            }
        }
        console.log(`✅ Enriched ${enriched}/${games.length} games with TGDB IDs`);
    } else {
        console.log("\nℹ️  Set TGDB_API_KEY in .env to enrich games with TheGamesDB data");
    }

    console.log("\n🚀 Seed complete! Run `npm run dev` to start QuestLog.");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
