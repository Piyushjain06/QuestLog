"use client";

import { GameCard } from "./GameCard";
import type { GameStatus } from "@/lib/utils";

interface GameEntry {
    id: string;
    game: {
        id: string;
        title: string;
        coverUrl: string | null;
        genres: string;
        platforms: string;
    };
    status: string;
    playtimeHrs: number;
    userRating: number | null;
}

interface GameGridProps {
    games: GameEntry[];
    emptyMessage?: string;
}

export function GameGrid({ games, emptyMessage = "No games found" }: GameGridProps) {
    if (games.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <span className="text-3xl">🎮</span>
                </div>
                <p className="text-muted-foreground text-lg">{emptyMessage}</p>
                <p className="text-muted-foreground/60 text-sm mt-1">
                    Import your Steam or Epic library to get started
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {games.map((entry) => (
                <div key={entry.id} className="animate-fade-in">
                    <GameCard
                        id={entry.game.id}
                        title={entry.game.title}
                        coverUrl={entry.game.coverUrl}
                        status={entry.status as GameStatus}
                        playtimeHrs={entry.playtimeHrs}
                        userRating={entry.userRating}
                        genres={entry.game.genres}
                        platforms={entry.game.platforms}
                    />
                </div>
            ))}
        </div>
    );
}
