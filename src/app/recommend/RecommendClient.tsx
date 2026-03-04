"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RecommendationCard } from "@/components/RecommendationCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Library, Star, Loader2 } from "lucide-react";
import Link from "next/link";

interface Recommendation {
    igdbId: number;
    title: string;
    coverUrl: string;
    description: string;
    releaseDate: string | null;
    rating: string | null;
    genres: string[];
    themes: string[];
    developers: string[];
    publishers: string[];
    platforms: string[];
    score: number;
    reason: string;
}

interface TrendingGame {
    igdbId: number;
    title: string;
    coverUrl: string;
    description: string;
    releaseDate: string | null;
    rating: string | null;
    genres: string[];
    themes: string[];
    developers: string[];
    publishers: string[];
    platforms: string[];
}

interface RecommendClientProps {
    recommendations: Recommendation[];
    trendingGames: TrendingGame[];
    hasUser: boolean;
}

export function RecommendClient({ recommendations, trendingGames, hasUser }: RecommendClientProps) {
    const [navigatingId, setNavigatingId] = useState<number | null>(null);
    const router = useRouter();

    const navigateToGame = async (game: TrendingGame) => {
        setNavigatingId(game.igdbId);
        try {
            const res = await fetch("/api/igdb/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ igdbId: game.igdbId, platforms: game.platforms, description: game.description }),
            });
            const data = await res.json();
            if (data.success && data.game?.id) {
                router.push(`/game/${data.game.id}`);
            }
        } catch {
            // Silently fail
        } finally {
            setNavigatingId(null);
        }
    };

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-neon-purple/20 bg-neon-purple/5 px-4 py-1.5 text-sm text-neon-purple">
                    <Sparkles className="h-4 w-4" />
                    AI-Powered Discovery
                </div>
                <h1 className="text-4xl font-display font-bold">
                    Discover Your Next <span className="gradient-text">Obsession</span>
                </h1>
                <p className="text-muted-foreground max-w-xl mx-auto">
                    Our content-based filtering analyzes your gaming taste and finds titles you&#39;ll love from IGDB&#39;s 300K+ catalog.
                </p>
            </div>

            {/* Personalized recommendations */}
            {recommendations.length > 0 ? (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="h-5 w-5 text-neon-purple" />
                        <h2 className="text-2xl font-display font-bold">Recommended for You</h2>
                        <Badge variant="outline" className="ml-auto">
                            {recommendations.length} matches
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {recommendations.map((rec) => (
                            <div key={rec.igdbId} className="animate-fade-in">
                                <RecommendationCard
                                    igdbId={rec.igdbId}
                                    title={rec.title}
                                    coverUrl={rec.coverUrl}
                                    genres={rec.genres}
                                    platforms={rec.platforms}
                                    description={rec.description}
                                    score={rec.score}
                                    reason={rec.reason}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <section className="glass-card p-8 text-center space-y-4">
                    <Library className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-display font-semibold">
                        {hasUser
                            ? "Add more games to get personalized recommendations"
                            : "Import your library to unlock recommendations"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        We need to know what you play to suggest new games.
                    </p>
                    <Link href="/profile">
                        <Button variant="neon">Go to Library</Button>
                    </Link>
                </section>
            )}

            {/* Trending section from IGDB */}
            {trendingGames.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="h-5 w-5 text-neon-orange" />
                        <h2 className="text-2xl font-display font-bold">Trending on IGDB</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {trendingGames.map((game) => (
                            <div key={game.igdbId} onClick={() => navigateToGame(game)} className="cursor-pointer">
                                <div className="group glass-card game-card-hover overflow-hidden">
                                    <div className="aspect-[3/4] bg-gradient-to-br from-muted to-background flex items-center justify-center relative overflow-hidden">
                                        {navigatingId === game.igdbId && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                                                <Loader2 className="h-6 w-6 text-neon-cyan animate-spin" />
                                            </div>
                                        )}
                                        {game.coverUrl ? (
                                            <Image
                                                src={game.coverUrl}
                                                alt={game.title}
                                                fill
                                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                                sizes="200px"
                                                unoptimized
                                            />
                                        ) : (
                                            <span className="text-4xl font-display font-bold text-muted-foreground/30">
                                                {game.title.charAt(0)}
                                            </span>
                                        )}
                                        {game.rating && (
                                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                                <span className="text-xs font-bold text-neon-orange">
                                                    <Star className="h-3 w-3 inline text-neon-orange fill-neon-orange mr-0.5" />
                                                    {parseFloat(game.rating).toFixed(0)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-semibold text-sm truncate group-hover:text-neon-cyan transition-colors">
                                            {game.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                            {game.genres.slice(0, 2).join(" · ")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
