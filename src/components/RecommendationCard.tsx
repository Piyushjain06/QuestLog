"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecommendationCardProps {
    id: string;
    title: string;
    coverUrl: string | null;
    genres: string[];
    score: number;
    reason: string;
}

export function RecommendationCard({
    id,
    title,
    coverUrl,
    genres,
    score,
    reason,
}: RecommendationCardProps) {
    const matchPercent = Math.min(Math.round(score * 10), 99);

    return (
        <Link href={`/game/${id}`}>
            <div className="group glass-card game-card-hover overflow-hidden cursor-pointer">
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    {coverUrl ? (
                        <Image
                            src={coverUrl}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
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
        </Link>
    );
}
