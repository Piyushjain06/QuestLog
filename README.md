<div align="center">

<img src="https://img.shields.io/badge/QuestLog-v1.0-6366f1?style=for-the-badge&logo=gamepad&logoColor=white" alt="QuestLog"/>

# 🎮 QuestLog

**Your personal gaming universe, beautifully organized.**

Track every game you've played, conquer your backlog, and celebrate your completions — all in one sleek dashboard powered by the Steam API.

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Steam API](https://img.shields.io/badge/Steam-API-1b2838?style=flat-square&logo=steam&logoColor=white)](https://developer.valvesoftware.com/wiki/Steam_Web_API)
[![License](https://img.shields.io/badge/License-Non--Commercial-orange?style=flat-square)](./LICENSE)

<br/>

[✨ Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [🚀 Getting Started](#-getting-started) • [🤝 Contributing](#-contributing)

---

</div>

<br/>

## 🌟 Why QuestLog?

> *"Life is too short to lose track of great games."*

Whether you're grinding through a 100-hour RPG, casually dipping into an indie gem, or staring down a backlog of shame — **QuestLog** gives you the clarity to know where you've been and what's next. It connects directly to Steam's rich game database, so your library always looks as good as it plays.

<br/>

## ✨ Features

### 📚 Smart Collection Management
Organize your entire gaming library into meaningful statuses at a glance:

| Status | Description |
|--------|-------------|
| 🎮 **Playing** | Currently active — your focus right now |
| ✅ **Completed** | Finished and filed away with pride |
| 📦 **Backlog** | Queued up and waiting for their moment |
| 💤 **On Hold** | Paused, but not forgotten |
| 🚮 **Dropped** | It's okay — not every game is for everyone |

### 🔗 Steam API Integration
- Automatically fetches **accurate game titles**, **cover art**, **release dates**, and **metadata**
- No manual data entry — just search and add
- Always up-to-date with Steam's live catalog

### 📱 Responsive, Modern UI
- Optimized for **desktop and mobile** out of the box
- Clean, fast, and intuitive — built for gamers, not spreadsheet lovers
- Dark-mode friendly design

### 🔒 Robust Data Handling
- Secure database operations via **Prisma ORM**
- Type-safe queries with **TypeScript** end-to-end
- Scalable schema ready for your ever-growing library

<br/>

## 🛠️ Tech Stack

```
QuestLog/
├── ⚡  Next.js 15       → Full-stack React framework (App Router)
├── 🔷  TypeScript        → End-to-end type safety
├── 🔺  Prisma ORM        → Type-safe database queries & migrations
└── 🎮  Steam Web API     → Live game data, artwork & metadata
```

<br/>

## 🚀 Getting Started

### Prerequisites

Before diving in, make sure you have:

- **Node.js** v18+ → [nodejs.org](https://nodejs.org/)
- **npm**, **yarn**, or **pnpm**
- A **PostgreSQL** database (or any Prisma-compatible DB)
- A **Steam Web API Key** → [Get one here](https://steamcommunity.com/dev/apikey)

---

### ⚙️ Installation

**1. Clone the repository**
```bash
git clone https://github.com/Piyushjain06/QuestLog.git
cd QuestLog
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the root directory:
```env
# 🗄️ Database
DATABASE_URL="your_database_connection_string"

# 🎮 Steam
STEAM_API_KEY="your_steam_api_key"
```

> 💡 **Tip:** You can get your Steam API key at [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)

**4. Set up the database**
```bash
npx prisma migrate dev
```

**5. Start the development server**
```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and start logging your quests. 🕹️

<br/>

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

```
1. 🍴  Fork the Project
2. 🌿  Create your Feature Branch   →  git checkout -b feature/AmazingFeature
3. 💾  Commit your Changes          →  git commit -m 'Add some AmazingFeature'
4. 📤  Push to the Branch           →  git push origin feature/AmazingFeature
5. 🔃  Open a Pull Request
```

Found a bug? Have an idea? **[Open an issue](https://github.com/Piyushjain06/QuestLog/issues)** — all feedback is welcome.

<br/>

## 📝 License

**© 2026 Piyush Jain. All Rights Reserved.**

This project is **source-available for personal, non-commercial use only**.

You're welcome to clone the repository, explore the code, and run it locally for personal use or education. However, you **may not**:

- ❌ Use this code to make money or for any commercial purpose
- ❌ Deploy or host this application publicly on the internet
- ❌ Distribute or sell copies of this software

See the [`LICENSE`](./LICENSE) file for the full terms.

<br/>

---

<div align="center">

Made with ❤️ and too many late nights by **[Piyush Jain](https://github.com/Piyushjain06)**

*Now stop reading and go clear that backlog.*

</div>
