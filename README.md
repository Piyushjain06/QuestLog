# QuestLog 🎮

**QuestLog** is a modern web application designed for gamers to track their video game collections, manage their backlogs, and showcase their gaming profiles. Built with a focus on type safety and a seamless user experience.

---

## 🚀 Features

* **Game Collection Tracking:** Add and organize games in your personal library.
* **Library Integration:** Planned support for importing game libraries from platforms like **Steam** and **Epic Games**.
* **Discord Integration:** Includes a Discord RPC worker to showcase your gaming status.
* **Responsive Design:** Built with **Tailwind CSS** for a seamless experience across all devices.
* **Type Safety:** Fully developed with **TypeScript** to ensure robust and maintainable code.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Linting:** ESLint

---

## 📁 Project Structure

* `src/`: Contains the core application logic and UI components.
* `prisma/`: Database schema and migrations.
* `discord-rpc-worker.js`: Script for Discord Rich Presence integration.
* `tailwind.config.ts`: Tailwind CSS configuration.
* `next.config.js`: Next.js configuration settings.

---

## ⚙️ Getting Started

### Prerequisites

* **Node.js** (Latest LTS version recommended)
* **npm** or **yarn**

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Piyushjain06/QuestLog.git](https://github.com/Piyushjain06/QuestLog.git)
    cd QuestLog
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and add your database connection string:
    ```env
    DATABASE_URL="your_postgresql_database_url_here"
    ```

4.  **Initialize the database:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📜 Scripts

* `npm run dev`: Starts the development server.
* `npm run build`: Builds the application for production.
* `npm run start`: Starts the production server.
* `npm run lint`: Runs ESLint to check for code quality issues.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve QuestLog.

## 📄 License

This project is licensed under the MIT License.


currently working on most of the features
