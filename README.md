# 🎮 QuestLog

QuestLog is a modern, full-stack web application designed to help you track, manage, and organize your video game collections. By leveraging the Steam API, it provides a seamless experience for fetching game data, allowing you to keep a detailed log of the titles you've played, are currently playing, or want to play next.

## ✨ Features

* **Collection Management:** Easily organize your games by status (e.g., Playing, Completed, Backlog).
* **Steam API Integration:** Automatically pull in accurate game details, cover art, and metadata directly from Steam.
* **Responsive UI:** A clean, interactive, and fast user interface optimized for both desktop and mobile viewing.
* **Robust Data Handling:** Secure and efficient database operations for managing your personal library.

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (React)
* **Language:** TypeScript
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **External APIs:** Steam Web API

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* npm, yarn, or pnpm
* A database compatible with Prisma (e.g., PostgreSQL)
* Steam Web API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Piyushjain06/QuestLog.git](https://github.com/Piyushjain06/QuestLog.git)
   cd QuestLog
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your necessary keys:
   ```env
   DATABASE_URL="your_database_connection_string"
   STEAM_API_KEY="your_steam_api_key"
   ```

4. **Set up the Database:**
   Run Prisma migrations to sync your schema with the database.
   ```bash
   npx prisma migrate dev
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in your browser to see the application.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

**© 2026 Piyush Jain. All Rights Reserved.**

This project is source-available for **personal, non-commercial use only**. 

You are welcome to clone the repository, explore the code, and run it locally for your own personal use or education. However, you **may not**:
* Use this code to make money or for any commercial purpose.
* Deploy or host this application on the internet.
* Distribute or sell copies of this software.

See the `LICENSE` file for full details.
