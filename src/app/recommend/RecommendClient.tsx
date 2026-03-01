"use client";

import { RecommendationCard } from "@/components/RecommendationCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Library } from "lucide-react";
import Link from "next/link";
import { parseJsonField } from "@/lib/utils";

interface Recommendation {
    id: string;
    title: string;
    coverUrl: string | null;
    genres: string[];
    tags: string[];
    score: number;
    reason: string;
}

interface TopGame {
    id: string;
    title: string;
    coverUrl: string | null;
    genres: string;
    rating: number | null;
}

interface RecommendClientProps {
    recommendations: Recommendation[];
    topGames: TopGame[];
    hasUser: boolean;
}

export function RecommendClient({ recommendations, topGames, hasUser }: RecommendClientProps) {
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
                    Our content-based filtering analyzes your gaming taste and finds titles you&#39;ll love.
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
                            <div key={rec.id} className="animate-fade-in">
                                <RecommendationCard
                                    id={rec.id}
                                    title={rec.title}
                                    coverUrl={rec.coverUrl}
                                    genres={rec.genres}
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

            {/* Top rated section */}
            {topGames.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="h-5 w-5 text-neon-orange" />
                        <h2 className="text-2xl font-display font-bold">Top Rated</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {topGames.map((game) => {
                            const genres = parseJsonField<string[]>(game.genres, []);
                            return (
                                <Link key={game.id} href={`/game/${game.id}`}>
                                    <div className="group glass-card game-card-hover overflow-hidden">
                                        <div className="aspect-[3/4] bg-gradient-to-br from-muted to-background flex items-center justify-center relative overflow-hidden">
                                            {game.coverUrl ? (
                                                <img
                                                    src={game.coverUrl}
                                                    alt={game.title}
                                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <span className="text-4xl font-display font-bold text-muted-foreground/30">
                                                    {game.title.charAt(0)}
                                                </span>
                                            )}
                                            {game.rating && (
                                                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                                    <span className="text-xs font-bold text-neon-orange">
                                                        ★ {game.rating.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-semibold text-sm truncate group-hover:text-neon-cyan transition-colors">
                                                {game.title}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                {genres.slice(0, 2).join(" · ")}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
