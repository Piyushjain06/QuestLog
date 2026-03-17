"use client";

import Link from "next/link";
import { Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatPlaytime, parseJsonField, type GameStatus } from "@/lib/utils";
import { useState } from "react";

interface GameCardProps {
    id: string;
    title: string;
    coverUrl: string | null;
    status: GameStatus;
    playtimeHrs: number;
    userRating: number | null;
    genres: string;
    platforms: string;
}

const statusVariantMap: Record<GameStatus, "playing" | "completed" | "dropped" | "backlog" | "planning"> = {
    PLAYING: "playing",
    COMPLETED: "completed",
    DROPPED: "dropped",
    BACKLOG: "backlog",
    PLANNING: "planning",
};

const statusLabel: Record<GameStatus, string> = {
    PLAYING: "Playing",
    COMPLETED: "Completed",
    DROPPED: "Dropped",
    BACKLOG: "Backlog",
    PLANNING: "Planning",
};

export function GameCard({
    id,
    title,
    coverUrl,
    status,
    playtimeHrs,
    userRating,
    genres,
}: GameCardProps) {
    const genreList = parseJsonField<string[]>(genres, []);
    const [imgError, setImgError] = useState(false);
    const [imgSrc, setImgSrc] = useState<string | null>(coverUrl);

    return (
        <Link href={`/game/${id}`}>
            <div className="group glass-card game-card-hover overflow-hidden cursor-pointer">
                {/* Cover image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    {coverUrl && !imgError ? (
                        <img
                            src={imgSrc || coverUrl}
                            alt={title}
                            onError={() => {
                                // Try Steam header.jpg as fallback if it looks like a library_600x900 URL
                                if (!imgError) {
                                    const steamMatch = coverUrl?.match(/steam\/apps\/([\d]+)\//);
                                    if (steamMatch) {
                                        setImgSrc(`https://cdn.akamai.steamstatic.com/steam/apps/${steamMatch[1]}/header.jpg`);
                                    } else {
                                        setImgError(true);
                                    }
                                } else {
                                    setImgError(true);
                                }
                            }}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-background">
                            <span className="text-4xl font-display font-bold text-muted-foreground/30">
                                {title.charAt(0)}
                            </span>
                        </div>
                    )}

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                        <Badge variant={statusVariantMap[status]}>{statusLabel[status]}</Badge>
                    </div>

                    {/* Hover info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                        <div className="flex items-center gap-3 text-xs text-white/80">
                            {playtimeHrs > 0 && (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatPlaytime(playtimeHrs)}
                                </span>
                            )}
                            {userRating && (
                                <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-neon-orange text-neon-orange" />
                                    {userRating}/10
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card body */}
                <div className="p-3">
                    <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-neon-cyan transition-colors duration-200">
                        {title}
                    </h3>
                    {genreList.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                            {genreList.slice(0, 2).join(" · ")}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
