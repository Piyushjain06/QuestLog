"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Plus, Check, Loader2, Gamepad2, ExternalLink, TrendingUp, Calendar, Star, Clock, Flame, ChevronDown, ChevronUp, Sparkles, Library, Filter, X, RefreshCw } from "lucide-react";
import Link from "next/link";
import { RecommendationCard } from "@/components/RecommendationCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IGDB_GENRES, IGDB_THEMES } from "@/lib/igdb-constants";

interface IGDBGame {
    igdbId: number;
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

interface DiscoverClientProps {
    recommendations?: Recommendation[];
    hasUser?: boolean;
}

export default function DiscoverClient({ recommendations = [], hasUser = false }: DiscoverClientProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<IGDBGame[]>([]);
    const [loading, setLoading] = useState(false);
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
    const [addingId, setAddingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [platformFilter, setPlatformFilter] = useState("ALL");
    const [navigatingId, setNavigatingId] = useState<number | null>(null);
    const [selectedGenre, setSelectedGenre] = useState("");
    const [selectedTheme, setSelectedTheme] = useState("");
    const [searchOffset, setSearchOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const router = useRouter();

    const [source, setSource] = useState<string>("igdb");
    const PAGE_SIZE = 50;

    // Recommendations state (client-side refreshable)
    const [currentRecs, setCurrentRecs] = useState<Recommendation[]>(recommendations);
    const [seenIds, setSeenIds] = useState<number[]>(recommendations.map((r) => r.igdbId));
    const [recsRefreshing, setRecsRefreshing] = useState(false);
    const [noMoreRecs, setNoMoreRecs] = useState(false);

    // Section data state
    const [trendingGames, setTrendingGames] = useState<IGDBGame[]>([]);
    const [anticipatedGames, setAnticipatedGames] = useState<IGDBGame[]>([]);
    const [comingSoonGames, setComingSoonGames] = useState<IGDBGame[]>([]);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [anticipatedLoading, setAnticipatedLoading] = useState(true);
    const [comingSoonLoading, setComingSoonLoading] = useState(true);
    const [showAllAnticipated, setShowAllAnticipated] = useState(false);
    const [showAllComingSoon, setShowAllComingSoon] = useState(false);

    const refreshRecommendations = async () => {
        if (recsRefreshing) return;
        setRecsRefreshing(true);
        setNoMoreRecs(false);
        try {
            const excludeParam = seenIds.join(",");
            const res = await fetch(`/api/recommendations?exclude=${excludeParam}`);
            const data = await res.json();
            const newRecs: Recommendation[] = data.recommendations ?? [];
            if (newRecs.length === 0) {
                setNoMoreRecs(true);
            } else {
                setCurrentRecs(newRecs);
                setSeenIds((prev) => [...prev, ...newRecs.map((r) => r.igdbId)]);
            }
        } catch {
            // Silently fail
        } finally {
            setRecsRefreshing(false);
        }
    };

    const INITIAL_COUNT = 8;

    // Fetch all sections on mount
    useEffect(() => {
        async function fetchSection(url: string, setter: (g: IGDBGame[]) => void, loadingSetter: (b: boolean) => void) {
            try {
                const res = await fetch(url);
                const data = await res.json();
                if (data.games) setter(data.games);
            } catch {
                // Silently fail
            } finally {
                loadingSetter(false);
            }
        }
        fetchSection("/api/igdb/trending", setTrendingGames, setTrendingLoading);
        fetchSection("/api/igdb/anticipated", setAnticipatedGames, setAnticipatedLoading);
        fetchSection("/api/igdb/coming-soon", setComingSoonGames, setComingSoonLoading);
    }, []);

    // Debounced search
    const searchGames = useCallback(async (q: string, genre: string, theme: string, offset: number = 0, append: boolean = false) => {
        const hasText = q.trim().length >= 2;
        const hasFilters = genre.length > 0 || theme.length > 0;
        if (!hasText && !hasFilters) {
            setResults([]);
            setHasMore(false);
            return;
        }
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }
        setError(null);
        setWarning(null);
        try {
            const params = new URLSearchParams();
            if (hasText) params.set("q", q);
            if (genre) params.set("genres", genre);
            if (theme) params.set("themes", theme);
            params.set("limit", String(PAGE_SIZE));
            params.set("offset", String(offset));
            const res = await fetch(`/api/igdb/search?${params.toString()}`);
            const data = await res.json();
            if (data.error) {
                setError(data.error);
                if (!append) setResults([]);
                setHasMore(false);
            } else {
                const newGames = data.games ?? [];
                if (append) {
                    setResults((prev) => [...prev, ...newGames]);
                } else {
                    setResults(newGames);
                }
                setSource(data.source || "igdb");
                setHasMore(newGames.length >= PAGE_SIZE);
                if (data.warning) setWarning(data.warning);
            }
        } catch {
            setError("Search failed. Check your connection.");
            if (!append) setResults([]);
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        setSearchOffset(0);
        setHasMore(false);
        const timeout = setTimeout(() => {
            const hasText = query.trim().length >= 2;
            const hasFilters = selectedGenre.length > 0 || selectedTheme.length > 0;
            if (hasText || hasFilters) {
                searchGames(query, selectedGenre, selectedTheme, 0, false);
            } else {
                setResults([]);
            }
        }, 400);
        return () => clearTimeout(timeout);
    }, [query, selectedGenre, selectedTheme, searchGames]);

    const loadMore = () => {
        const nextOffset = searchOffset + PAGE_SIZE;
        setSearchOffset(nextOffset);
        searchGames(query, selectedGenre, selectedTheme, nextOffset, true);
    };

    const filteredResults = platformFilter === "ALL"
        ? results
        : results.filter((game) =>
            game.platforms.some((p) =>
                platformFilter.split("|").some((f) => p.toLowerCase().includes(f.toLowerCase()))
            )
        );

    const isSearching = query.trim().length >= 2 || selectedGenre.length > 0 || selectedTheme.length > 0;

    const addToLibrary = async (game: IGDBGame) => {
        setAddingId(game.igdbId);
        try {
            const res = await fetch("/api/igdb/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ igdbId: game.igdbId, status: "BACKLOG", platforms: game.platforms, description: game.description }),
            });
            const data = await res.json();
            if (data.success) {
                setAddedIds((prev) => { const s = new Set(Array.from(prev)); s.add(game.igdbId); return s; });
            }
        } catch {
            // Silently fail
        } finally {
            setAddingId(null);
        }
    };

    const navigateToGame = async (game: IGDBGame) => {
        if (game.localId) { router.push(`/game/${game.localId}`); return; }
        setNavigatingId(game.igdbId);
        try {
            const res = await fetch("/api/igdb/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ igdbId: game.igdbId, platforms: game.platforms, description: game.description }),
            });
            const data = await res.json();
            if (data.success && data.game?.id) router.push(`/game/${data.game.id}`);
        } catch {
            // Silently fail
        } finally {
            setNavigatingId(null);
        }
    };

    const formatDateShort = (dateStr: string | null) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    // ── Small Game Card (horizontal scroll) ─────────────────────────────
    const GameCard = ({ game, showRating = false, showDate = false }: { game: IGDBGame; showRating?: boolean; showDate?: boolean }) => {
        const isAdded = addedIds.has(game.igdbId);
        const isAdding = addingId === game.igdbId;
        const isNavigating = navigatingId === game.igdbId;

        return (
            <div className="group relative flex-shrink-0 w-[180px] sm:w-[200px]">
                <div className="glass-card overflow-hidden rounded-xl hover:border-neon-cyan/30 transition-all duration-300 h-full flex flex-col">
                    <div
                        className="relative aspect-[3/4] overflow-hidden bg-card/50 cursor-pointer"
                        onClick={() => navigateToGame(game)}
                    >
                        {isNavigating && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                                <Loader2 className="h-6 w-6 text-neon-cyan animate-spin" />
                            </div>
                        )}
                        {game.coverUrl ? (
                            <Image src={game.coverUrl} alt={game.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="200px" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20">
                                <Gamepad2 className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                        )}
                        {showRating && game.rating && (
                            <div className="absolute top-2 left-2">
                                <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                    <Star className="h-3 w-3 text-neon-orange fill-neon-orange" />
                                    <span className="text-xs font-bold text-neon-orange">{parseFloat(game.rating).toFixed(0)}%</span>
                                </div>
                            </div>
                        )}
                        {showDate && game.releaseDate && (
                            <div className="absolute top-2 left-2">
                                <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                    <Calendar className="h-3 w-3 text-neon-cyan" />
                                    <span className="text-xs font-bold text-neon-cyan">{formatDateShort(game.releaseDate)}</span>
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <button
                                onClick={(e) => { e.stopPropagation(); if (!isAdded && !isAdding) addToLibrary(game); }}
                                disabled={isAdded || isAdding}
                                className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${isAdded ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30"}`}
                            >
                                {isAdding ? (<><Loader2 className="h-3 w-3 animate-spin" /> Adding...</>) : isAdded ? (<><Check className="h-3 w-3" /> Added</>) : (<><Plus className="h-3 w-3" /> Add to Library</>)}
                            </button>
                        </div>
                    </div>
                    <div className="p-3 space-y-1.5 flex-1">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 cursor-pointer group-hover:text-neon-cyan transition-colors" onClick={() => navigateToGame(game)}>
                            {game.title}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                            {game.genres.slice(0, 2).map((genre) => (
                                <Badge key={genre} variant="outline" className="text-[10px] px-1.5 py-0">{genre}</Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ── List Row Item (used for both Most Anticipated and Coming Soon) ───
    const ListItem = ({ game }: { game: IGDBGame }) => {
        const isNavigating = navigatingId === game.igdbId;
        const isAdded = addedIds.has(game.igdbId);
        const isAdding = addingId === game.igdbId;

        return (
            <div
                className="group flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-card/50 transition-all duration-200 cursor-pointer border border-transparent hover:border-border/50"
                onClick={() => navigateToGame(game)}
            >
                <div className="relative w-11 h-14 flex-shrink-0 rounded-md overflow-hidden bg-card/50">
                    {isNavigating && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                            <Loader2 className="h-4 w-4 text-neon-cyan animate-spin" />
                        </div>
                    )}
                    {game.coverUrl ? (
                        <Image src={game.coverUrl} alt={game.title} fill className="object-cover" sizes="44px" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight truncate group-hover:text-neon-cyan transition-colors">{game.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDateShort(game.releaseDate)}</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); if (!isAdded && !isAdding) addToLibrary(game); }}
                    disabled={isAdded || isAdding}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${isAdded ? "text-green-400" : "text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10"}`}
                    title={isAdded ? "Added to library" : "Add to library"}
                >
                    {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>
            </div>
        );
    };

    // ── Skeletons ───────────────────────────────────────────────────────
    const SkeletonCard = () => (
        <div className="flex-shrink-0 w-[180px] sm:w-[200px]">
            <div className="glass-card overflow-hidden rounded-xl h-full">
                <div className="aspect-[3/4] bg-card/50 animate-pulse" />
                <div className="p-3 space-y-2">
                    <div className="h-4 bg-card/50 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-card/50 rounded animate-pulse w-1/2" />
                </div>
            </div>
        </div>
    );

    const ListSkeleton = () => (
        <div className="flex items-center gap-3 py-3 px-3">
            <div className="w-11 h-14 rounded-md bg-card/50 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-card/50 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-card/50 rounded animate-pulse w-1/3" />
            </div>
        </div>
    );

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
                        Search over 300,000 games from IGDB. Explore trending titles and upcoming releases.
                    </p>

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
                            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neon-cyan animate-spin" />}
                        </div>
                    </div>

                    {/* Genre & Theme Filter Dropdowns */}
                    <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl mx-auto mb-5">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <select
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="appearance-none pl-9 pr-8 py-2.5 rounded-lg bg-card/80 border border-border/50 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan/50 backdrop-blur-sm transition-all cursor-pointer min-w-[160px]"
                            >
                                <option value="">All Genres</option>
                                {IGDB_GENRES.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <select
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                                className="appearance-none pl-9 pr-8 py-2.5 rounded-lg bg-card/80 border border-border/50 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-neon-cyan/50 backdrop-blur-sm transition-all cursor-pointer min-w-[160px]"
                            >
                                <option value="">All Themes</option>
                                {IGDB_THEMES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                        {(selectedGenre || selectedTheme) && (
                            <button
                                onClick={() => { setSelectedGenre(""); setSelectedTheme(""); }}
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                            >
                                <X className="h-3.5 w-3.5" />
                                Clear Filters
                            </button>
                        )}
                    </div>

                    {isSearching && (
                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto animate-fade-in">
                            {PLATFORM_FILTERS.map((pf) => (
                                <button
                                    key={pf.value}
                                    onClick={() => setPlatformFilter(pf.value)}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${platformFilter === pf.value ? "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30 shadow-sm shadow-neon-cyan/10" : "bg-card/50 text-muted-foreground border-white/5 hover:bg-card/80 hover:text-foreground"}`}
                                >
                                    <span>{pf.icon}</span>
                                    <span>{pf.label}</span>
                                    {platformFilter === pf.value && results.length > 0 && (
                                        <span className="ml-0.5 text-xs bg-neon-cyan/20 px-1.5 py-0.5 rounded-full">{filteredResults.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {error && (
                <div className="mx-auto max-w-4xl px-4 mb-6">
                    <div className="glass-card p-4 border-red-500/30 text-red-400 text-center rounded-lg">⚠️ {error}</div>
                </div>
            )}
            {warning && (
                <div className="mx-auto max-w-4xl px-4 mb-6">
                    <div className="glass-card p-4 border-yellow-500/30 text-yellow-400 text-center rounded-lg text-sm">⚠️ {warning}</div>
                </div>
            )}

            {/* Search Results */}
            {isSearching && (
                <section className="mx-auto max-w-7xl px-4 pb-16">
                    {results.length > 0 && (
                        <p className="text-sm text-muted-foreground mb-6">
                            Showing <span className="text-neon-cyan font-semibold">{filteredResults.length}</span>
                            {platformFilter !== "ALL" && ` ${PLATFORM_FILTERS.find(f => f.value === platformFilter)?.label}`} results
                            {filteredResults.length !== results.length && ` (${results.length} total)`} for &quot;{query}&quot;
                        </p>
                    )}
                    {!loading && filteredResults.length === 0 && !error && (
                        <div className="text-center py-16">
                            <Gamepad2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground text-lg">
                                {results.length > 0 && platformFilter !== "ALL"
                                    ? `No games found for ${PLATFORM_FILTERS.find(f => f.value === platformFilter)?.label}. Try a different platform.`
                                    : "No games found. Try a different search term."}
                            </p>
                            {results.length > 0 && platformFilter !== "ALL" && (
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => setPlatformFilter("ALL")}>Show all platforms</Button>
                            )}
                        </div>
                    )}
                    <div className="grid gap-4">
                        {filteredResults.map((game) => {
                            const isAdded = addedIds.has(game.igdbId);
                            const isAdding = addingId === game.igdbId;
                            return (
                                <div key={game.igdbId} className="glass-card rounded-xl overflow-hidden hover:border-neon-cyan/30 transition-all duration-300 group">
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="relative w-full sm:w-32 md:w-40 h-44 sm:h-auto flex-shrink-0 bg-card/50 cursor-pointer" onClick={() => navigateToGame(game)}>
                                            {navigatingId === game.igdbId && (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50"><Loader2 className="h-6 w-6 text-neon-cyan animate-spin" /></div>
                                            )}
                                            {game.coverUrl ? (
                                                <Image src={game.coverUrl} alt={game.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 160px" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="h-10 w-10 text-muted-foreground/30" /></div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-foreground group-hover:text-neon-cyan transition-colors line-clamp-1 cursor-pointer" onClick={() => navigateToGame(game)}>{game.title}</h3>
                                                    {game.releaseDate && <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">{game.releaseDate}</span>}
                                                </div>
                                                {game.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{game.description}</p>}
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {game.genres.slice(0, 4).map((genre) => <Badge key={genre} variant="default" className="text-xs">{genre}</Badge>)}
                                                    {game.platforms.slice(0, 3).map((p) => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
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
                                                    {isAdding ? (<><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Adding...</>) : isAdded ? (<><Check className="h-3.5 w-3.5 mr-1.5" /> Added</>) : (<><Plus className="h-3.5 w-3.5 mr-1.5" /> Add to Library</>)}
                                                </Button>
                                                <a href="https://www.igdb.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-neon-cyan transition-colors flex items-center gap-1">
                                                    <ExternalLink className="h-3 w-3" /> IGDB
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Load More Button */}
                    {hasMore && !loading && (
                        <div className="flex justify-center mt-8">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20 hover:shadow-lg hover:shadow-neon-cyan/10 transition-all duration-300 disabled:opacity-50"
                            >
                                {loadingMore ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Loading more…</>
                                ) : (
                                    <><ChevronDown className="h-4 w-4" /> Load More Results</>
                                )}
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Discovery sections — shown when NOT searching */}
            {!isSearching && (
                <section className="mx-auto max-w-7xl px-4 pb-16 space-y-14">

                    {/* ✨ Recommended for You (Only shown if user has recommendations or is logged in) */}
                    {hasUser && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-pink-500/20 border border-neon-purple/30">
                                    <Sparkles className="h-5 w-5 text-neon-purple" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-display font-bold">Recommended for You</h2>
                                    <p className="text-sm text-muted-foreground">AI-powered suggestions based on your library</p>
                                </div>
                                {currentRecs.length > 0 && (
                                    <button
                                        onClick={refreshRecommendations}
                                        disabled={recsRefreshing || noMoreRecs}
                                        title={noMoreRecs ? "No more recommendations" : "Get fresh recommendations"}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${
                                            noMoreRecs
                                                ? "text-muted-foreground/40 border-border/20 cursor-not-allowed"
                                                : "text-neon-purple border-neon-purple/30 hover:bg-neon-purple/10 hover:shadow-lg hover:shadow-neon-purple/10"
                                        }`}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${recsRefreshing ? "animate-spin" : ""}`} />
                                        <span>{recsRefreshing ? "Refreshing…" : noMoreRecs ? "All caught up" : "Refresh"}</span>
                                    </button>
                                )}
                            </div>

                            {currentRecs.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {currentRecs.map((rec) => (
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
                            ) : (
                                <div className="glass-card p-8 text-center space-y-4 rounded-xl border border-border/30 bg-background/50">
                                    <Library className="h-10 w-10 mx-auto text-muted-foreground/50" />
                                    <h3 className="text-lg font-display font-semibold">
                                        Import games to unlock recommendations
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        We need to know what you play to suggest new games. Search and add games to your library!
                                    </p>
                                    <Link href="/profile">
                                        <Button variant="neon" size="sm">Go to Library</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 🔥 Trending Now — horizontal scroll, shown first */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                                <TrendingUp className="h-5 w-5 text-orange-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-display font-bold">Trending Now</h2>
                                <p className="text-sm text-muted-foreground">Top-rated games from the last 3 months</p>
                            </div>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50 hover:scrollbar-thumb-border">
                            {trendingLoading
                                ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                                : trendingGames.length > 0
                                    ? trendingGames.map((game) => <GameCard key={game.igdbId} game={game} showRating />)
                                    : (
                                        <div className="w-full text-center py-12">
                                            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                                            <p className="text-muted-foreground">No trending games available right now</p>
                                        </div>
                                    )
                            }
                        </div>
                    </div>

                    {/* Most Anticipated + Coming Soon — side by side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* 🔥 Most Anticipated */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple/20 to-pink-500/20 border border-neon-purple/30">
                                    <Flame className="h-5 w-5 text-neon-purple" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-display font-bold">Most Anticipated</h2>
                                    <p className="text-sm text-muted-foreground">The most hyped upcoming releases</p>
                                </div>
                            </div>
                            {anticipatedLoading ? (
                                <div className="glass-card rounded-xl divide-y divide-border/30">
                                    {Array.from({ length: 6 }).map((_, i) => <ListSkeleton key={i} />)}
                                </div>
                            ) : anticipatedGames.length > 0 ? (
                                <>
                                    <div className="glass-card rounded-xl divide-y divide-border/30">
                                        {anticipatedGames.slice(0, showAllAnticipated ? undefined : INITIAL_COUNT).map((game) => (
                                            <ListItem key={game.igdbId} game={game} />
                                        ))}
                                    </div>
                                    {anticipatedGames.length > INITIAL_COUNT && (
                                        <button
                                            onClick={() => setShowAllAnticipated(!showAllAnticipated)}
                                            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-neon-purple border border-border/30 hover:border-neon-purple/30 hover:bg-neon-purple/5 transition-all"
                                        >
                                            {showAllAnticipated ? (
                                                <><ChevronUp className="h-4 w-4" /> Show Less</>
                                            ) : (
                                                <><ChevronDown className="h-4 w-4" /> View More ({anticipatedGames.length - INITIAL_COUNT})</>
                                            )}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 glass-card rounded-xl">
                                    <Flame className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                                    <p className="text-muted-foreground">No anticipated games available right now</p>
                                </div>
                            )}
                        </div>

                        {/* 📅 Coming Soon */}
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-blue-500/20 border border-neon-cyan/30">
                                    <Clock className="h-5 w-5 text-neon-cyan" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-display font-bold">Coming Soon</h2>
                                    <p className="text-sm text-muted-foreground">Releasing in the next 2 weeks</p>
                                </div>
                            </div>
                            {comingSoonLoading ? (
                                <div className="glass-card rounded-xl divide-y divide-border/30">
                                    {Array.from({ length: 6 }).map((_, i) => <ListSkeleton key={i} />)}
                                </div>
                            ) : comingSoonGames.length > 0 ? (
                                <>
                                    <div className="glass-card rounded-xl divide-y divide-border/30">
                                        {comingSoonGames.slice(0, showAllComingSoon ? undefined : INITIAL_COUNT).map((game) => (
                                            <ListItem key={game.igdbId} game={game} />
                                        ))}
                                    </div>
                                    {comingSoonGames.length > INITIAL_COUNT && (
                                        <button
                                            onClick={() => setShowAllComingSoon(!showAllComingSoon)}
                                            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-neon-cyan border border-border/30 hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all"
                                        >
                                            {showAllComingSoon ? (
                                                <><ChevronUp className="h-4 w-4" /> Show Less</>
                                            ) : (
                                                <><ChevronDown className="h-4 w-4" /> View More ({comingSoonGames.length - INITIAL_COUNT})</>
                                            )}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 glass-card rounded-xl">
                                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                                    <p className="text-muted-foreground">No games releasing in the next 2 weeks</p>
                                </div>
                            )}
                        </div>

                    </div>

                </section>
            )}
        </div>
    );
}
