import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

export const metadata: Metadata = {
    title: "QuestLog — Track Your Gaming Journey",
    description:
        "Track your video game collection across Steam and Epic, manage missions, and discover new games with AI-powered recommendations.",
    keywords: ["game tracker", "steam", "epic games", "game collection", "gaming"],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                suppressHydrationWarning
                className={`${inter.variable} ${outfit.variable} min-h-screen bg-background font-sans antialiased`}
            >
                <Providers>
                    <Navbar />
                    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    );
}

