"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecommendationCardProps {
    igdbId: number;
    title: string;
    coverUrl: string | null;
    genres: string[];
    platforms: string[];
    description: string;
    score: number;
    reason: string;
}

export function RecommendationCard({
    igdbId,
    title,
    coverUrl,
    genres,
    platforms,
    description,
    score,
    reason,
}: RecommendationCardProps) {
    const matchPercent = Math.min(Math.round(score * 10), 99);
    const [navigating, setNavigating] = useState(false);
    const router = useRouter();

    const handleClick = async () => {
        setNavigating(true);
        try {
            const res = await fetch("/api/igdb/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ igdbId, platforms, description }),
            });
            const data = await res.json();
            if (data.success && data.game?.id) {
                router.push(`/game/${data.game.id}`);
            }
        } catch {
            // Silently fail
        } finally {
            setNavigating(false);
        }
    };

    return (
        <div onClick={handleClick} className="cursor-pointer">
            <div className="group glass-card game-card-hover overflow-hidden">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    {navigating && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                            <Loader2 className="h-6 w-6 text-neon-cyan animate-spin" />
                        </div>
                    )}
                    {coverUrl ? (
                        <Image
                            src={coverUrl}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            unoptimized
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20">
                            <span className="text-4xl font-display font-bold text-muted-foreground/30">
                                {title.charAt(0)}
                            </span>
                        </div>
                    )}

                    {/* Match score */}
                    <div className="absolute top-2 left-2">
                        <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                            <Sparkles className="h-3 w-3 text-neon-purple" />
                            <span className="text-xs font-bold text-neon-cyan">{matchPercent}%</span>
                        </div>
                    </div>
                </div>

                <div className="p-3 space-y-2">
                    <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-neon-cyan transition-colors">
                        {title}
                    </h3>
                    <p className="text-xs text-neon-purple">{reason}</p>
                    <div className="flex flex-wrap gap-1">
                        {genres.slice(0, 2).map((genre) => (
                            <Badge key={genre} variant="outline" className="text-[10px] px-1.5 py-0">
                                {genre}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
