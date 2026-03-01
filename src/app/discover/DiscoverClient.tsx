"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Plus, Check, Loader2, Gamepad2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TGDBGame {
    tgdbId: number;
    title: string;
    description: string;
    coverUrl: string;
    releaseDate: string | null;
    rating: string | null;
    genres: string[];
    developers: string[];
    publishers: string[];
    platforms: string[];
    localId?: string;
}

const PLATFORM_FILTERS = [
    { label: "All", value: "ALL", icon: "🎮" },
    { label: "PC", value: "PC", icon: "🖥️" },
    { label: "PlayStation", value: "PlayStation", icon: "🎮" },
    { label: "Xbox", value: "Xbox", icon: "🟢" },
    { label: "Nintendo", value: "Nintendo", icon: "🔴" },
    { label: "Mobile", value: "Android|iOS", icon: "📱" },
];

export default function DiscoverClient() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<TGDBGame[]>([]);
    const [loading, setLoading] = useState(false);
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
    const [addingId, setAddingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [platformFilter, setPlatformFilter] = useState("ALL");
    const [navigatingId, setNavigatingId] = useState<number | null>(null);
    const router = useRouter();

    const [source, setSource] = useState<string>("tgdb");

    // Debounced search
    const searchGames = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/tgdb/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (data.error) {
                setError(data.error);
                setResults([]);
            } else {
                setResults(data.games ?? []);
                setSource(data.source || "tgdb");
            }
        } catch {
            setError("Search failed. Check your connection.");
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (query.trim().length >= 2) {
                searchGames(query);
            } else {
                setResults([]);
            }
        }, 400);
        return () => clearTimeout(timeout);
    }, [query, searchGames]);

    // Filter results by selected platform
    const filteredResults = platformFilter === "ALL"
        ? results
        : results.filter((game) =>
            game.platforms.some((p) =>
                platformFilter.split("|").some((f) => p.toLowerCase().includes(f.toLowerCase()))
            )
        );

    const addToLibrary = async (game: TGDBGame) => {
        setAddingId(game.tgdbId);
        try {
            const res = await fetch("/api/tgdb/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tgdbId: game.tgdbId, status: "BACKLOG", platforms: game.platforms, description: game.description }),
            });
            const data = await res.json();
            if (data.success) {
                setAddedIds((prev) => { const s = new Set(Array.from(prev)); s.add(game.tgdbId); return s; });
            }
        } catch {
            // Silently fail
        } finally {
            setAddingId(null);
        }
    };

    const navigateToGame = async (game: TGDBGame) => {
        // If the game already exists locally, navigate directly
        if (game.localId) {
            router.push(`/game/${game.localId}`);
            return;
        }
        setNavigatingId(game.tgdbId);
        try {
            const res = await fetch("/api/tgdb/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tgdbId: game.tgdbId, platforms: game.platforms, description: game.description }),
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
        <div className="min-h-screen">
            {/* Hero / Search Header */}
            <section className="relative py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 via-transparent to-transparent" />
                <div className="relative mx-auto max-w-4xl px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                        <span className="gradient-text">Discover</span>{" "}
                        <span className="text-foreground">Games</span>
                    </h1>
                    <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                        Search over 80,000 games from TheGamesDB. Find your next adventure and add it to your library.
                    </p>

                    {/* Search bar */}
                    <div className="relative max-w-2xl mx-auto mb-5">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for games... (e.g., Zelda, Final Fantasy, Halo)"
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-card/80 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan/50 backdrop-blur-sm text-lg transition-all"
                                autoFocus
                            />
                            {loading && (
                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-cyan animate-spin" />
                            )}
                        </div>
                        <div className="absolute inset-0 -z-10 blur-xl bg-neon-cyan/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                    </div>

                    {/* Platform filter */}
                    <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                        {PLATFORM_FILTERS.map((pf) => (
                            <button
                                key={pf.value}
                                onClick={() => setPlatformFilter(pf.value)}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${platformFilter === pf.value
                                    ? "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30 shadow-sm shadow-neon-cyan/10"
                                    : "bg-card/50 text-muted-foreground border-white/5 hover:bg-card/80 hover:text-foreground"
                                    }`}
                            >
                                <span>{pf.icon}</span>
                                <span>{pf.label}</span>
                                {platformFilter === pf.value && results.length > 0 && (
                                    <span className="ml-0.5 text-xs bg-neon-cyan/20 px-1.5 py-0.5 rounded-full">
                                        {filteredResults.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Error */}
            {error && (
                <div className="mx-auto max-w-4xl px-4 mb-6">
                    <div className="glass-card p-4 border-red-500/30 text-red-400 text-center rounded-lg">
                        ⚠️ {error}
                    </div>
                </div>
            )}

            {/* Results */}
            <section className="mx-auto max-w-7xl px-4 pb-16">
                {results.length > 0 && (
                    <p className="text-sm text-muted-foreground mb-6">
                        Showing <span className="text-neon-cyan font-semibold">{filteredResults.length}</span>
                        {platformFilter !== "ALL" && ` ${PLATFORM_FILTERS.find(f => f.value === platformFilter)?.label}`} results
                        {filteredResults.length !== results.length && ` (${results.length} total)`} for &quot;{query}&quot;
                    </p>
                )}

                {query.length >= 2 && !loading && filteredResults.length === 0 && !error && (
                    <div className="text-center py-16">
                        <Gamepad2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground text-lg">
                            {results.length > 0 && platformFilter !== "ALL"
                                ? `No games found for ${PLATFORM_FILTERS.find(f => f.value === platformFilter)?.label}. Try a different platform.`
                                : "No games found. Try a different search term."}
                        </p>
                        {results.length > 0 && platformFilter !== "ALL" && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => setPlatformFilter("ALL")}
                            >
                                Show all platforms
                            </Button>
                        )}
                    </div>
                )}

                {query.length < 2 && (
                    <div className="text-center py-16">
                        <Search className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground">Type at least 2 characters to search</p>
                    </div>
                )}

                <div className="grid gap-4">
                    {filteredResults.map((game) => {
                        const isAdded = addedIds.has(game.tgdbId);
                        const isAdding = addingId === game.tgdbId;

                        return (
                            <div
                                key={game.tgdbId}
                                className="glass-card rounded-xl overflow-hidden hover:border-neon-cyan/30 transition-all duration-300 group"
                            >
                                <div className="flex flex-col sm:flex-row">
                                    {/* Cover art */}
                                    <div
                                        className="relative w-full sm:w-32 md:w-40 h-44 sm:h-auto flex-shrink-0 bg-card/50 cursor-pointer"
                                        onClick={() => navigateToGame(game)}
                                    >
                                        {navigatingId === game.tgdbId && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                                                <Loader2 className="h-6 w-6 text-neon-cyan animate-spin" />
                                            </div>
                                        )}
                                        {game.coverUrl ? (
                                            <Image
                                                src={game.coverUrl}
                                                alt={game.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 640px) 100vw, 160px"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Gamepad2 className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <h3
                                                    className="text-lg font-semibold text-foreground group-hover:text-neon-cyan transition-colors line-clamp-1 cursor-pointer"
                                                    onClick={() => navigateToGame(game)}
                                                >
                                                    {game.title}
                                                </h3>
                                                {game.releaseDate && (
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">
                                                        {game.releaseDate}
                                                    </span>
                                                )}
                                            </div>

                                            {game.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                    {game.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {game.genres.slice(0, 4).map((genre) => (
                                                    <Badge key={genre} variant="default" className="text-xs">
                                                        {genre}
                                                    </Badge>
                                                ))}
                                                {game.platforms.slice(0, 3).map((p) => (
                                                    <Badge key={p} variant="outline" className="text-xs">
                                                        {p}
                                                    </Badge>
                                                ))}
                                            </div>

                                            {(game.developers.length > 0 || game.publishers.length > 0) && (
                                                <p className="text-xs text-muted-foreground">
                                                    {game.developers[0] && <span>by <span className="text-foreground/80">{game.developers[0]}</span></span>}
                                                    {game.publishers[0] && game.developers[0] && " · "}
                                                    {game.publishers[0] && <span>Published by <span className="text-foreground/80">{game.publishers[0]}</span></span>}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                variant={isAdded ? "outline" : "default"}
                                                className={isAdded ? "text-green-400 border-green-400/30" : "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 border border-neon-cyan/30"}
                                                onClick={() => !isAdded && !isAdding && addToLibrary(game)}
                                                disabled={isAdded || isAdding}
                                            >
                                                {isAdding ? (
                                                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Adding...</>
                                                ) : isAdded ? (
                                                    <><Check className="h-3.5 w-3.5 mr-1.5" /> Added</>
                                                ) : (
                                                    <><Plus className="h-3.5 w-3.5 mr-1.5" /> Add to Library</>
                                                )}
                                            </Button>
                                            <a
                                                href={`https://thegamesdb.net/game.php?id=${game.tgdbId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-muted-foreground hover:text-neon-cyan transition-colors flex items-center gap-1"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                TGDB
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
