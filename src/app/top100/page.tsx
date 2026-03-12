"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
    Trophy,
    Filter,
    Loader2,
    Gamepad2,
    ChevronDown,
    Plus,
    Check,
    X,
    Star,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { IGDB_GENRES } from "@/lib/igdb-constants";

interface Top100Game {
    rank: number;
    igdbId: number;
    title: string;
    description: string;
    coverUrl: string;
    releaseDate: string | null;
    rating: number | null;
    ratingCount: number;
    genres: string[];
    themes: string[];
    developers: string[];
    publishers: string[];
    platforms: string[];
}

const PLATFORM_OPTIONS = [
    { label: "All Platforms", value: "" },
    { label: "PC", value: "PC" },
    { label: "PlayStation", value: "PlayStation" },
    { label: "Xbox", value: "Xbox" },
    { label: "Nintendo", value: "Nintendo" },
    { label: "iOS", value: "iOS" },
    { label: "Android", value: "Android" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

const SELECT_CLASS =
    "appearance-none pl-9 pr-8 py-2.5 rounded-lg bg-card/80 border border-border/50 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 backdrop-blur-sm transition-all cursor-pointer";

export default function Top100Page() {
    const router = useRouter();
    const [games, setGames] = useState<Top100Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGenre, setSelectedGenre] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const [fromYear, setFromYear] = useState("");
    const [toYear, setToYear] = useState("");
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
    const [addingId, setAddingId] = useState<number | null>(null);
    const [navigatingId, setNavigatingId] = useState<number | null>(null);
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const fetchGames = useCallback(
        async (genre: string, platform: string, from: string, to: string) => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (genre) params.set("genre", genre);
                if (platform) params.set("platform", platform);
                if (from) params.set("fromYear", from);
                if (to) params.set("toYear", to);
                params.set("limit", "100");
                const res = await fetch(`/api/igdb/top100?${params}`);
                const data = await res.json();
                setGames(data.games ?? []);
            } catch {
                setGames([]);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        fetchGames(selectedGenre, selectedPlatform, fromYear, toYear);
    }, [selectedGenre, selectedPlatform, fromYear, toYear, fetchGames]);

    const addToLibrary = async (game: Top100Game) => {
        setAddingId(game.igdbId);
        try {
            const res = await fetch("/api/igdb/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    igdbId: game.igdbId,
                    status: "BACKLOG",
                    platforms: game.platforms,
                    description: game.description,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setAddedIds((prev) => new Set([...Array.from(prev), game.igdbId]));
            }
        } catch { /* silent */ }
        finally { setAddingId(null); }
    };

    const navigateToGame = async (game: Top100Game) => {
        setNavigatingId(game.igdbId);
        try {
            const res = await fetch("/api/igdb/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    igdbId: game.igdbId,
                    platforms: game.platforms,
                    description: game.description,
                }),
            });
            const data = await res.json();
            if (data.success && data.game?.id) router.push(`/game/${data.game.id}`);
        } catch { /* silent */ }
        finally { setNavigatingId(null); }
    };

    const clearFilters = () => {
        setSelectedGenre("");
        setSelectedPlatform("");
        setFromYear("");
        setToYear("");
    };

    const hasFilters = selectedGenre || selectedPlatform || fromYear || toYear;

    // Apply sort direction — asc reverses the Bayesian-ranked list
    const displayedGames = sortOrder === "asc" ? [...games].reverse() : games;

    const rankColor = (r: number) =>
        r === 1 ? "text-yellow-400" : r === 2 ? "text-slate-300" : r === 3 ? "text-amber-500" : "text-muted-foreground/60";

    const rankBorderColor = (r: number) =>
        r === 1 ? "border-l-yellow-400/60" : r === 2 ? "border-l-slate-300/40" : r === 3 ? "border-l-amber-500/50" : "border-l-transparent";

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative py-14 md:py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent" />
                <div className="relative mx-auto max-w-5xl px-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 flex-shrink-0">
                            <Trophy className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-display font-bold">
                                <span className="text-foreground">Best </span>
                                <span style={{ background: "linear-gradient(135deg, #facc15, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                    Games
                                </span>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Top 100 highest-rated games, weighted by number of votes</p>
                        </div>
                    </div>

                    {/* Filters + sort row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Platform */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)} className={`${SELECT_CLASS} min-w-[160px]`}>
                                {PLATFORM_OPTIONS.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* Genre */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className={`${SELECT_CLASS} min-w-[150px]`}>
                                <option value="">All Genres</option>
                                {IGDB_GENRES.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* From Year */}
                        <div className="relative">
                            <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} className={`${SELECT_CLASS} pl-3 min-w-[120px]`}>
                                <option value="">From Year</option>
                                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        </div>

                        {/* To Year */}
                        <div className="relative">
                            <select value={toYear} onChange={(e) => setToYear(e.target.value)} className={`${SELECT_CLASS} pl-3 min-w-[120px]`}>
                                <option value="">To Year</option>
                                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        </div>

                        {hasFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                            >
                                <X className="h-3.5 w-3.5" /> Clear
                            </button>
                        )}

                        {/* Sort order toggle */}
                        <button
                            onClick={() => setSortOrder((o) => o === "desc" ? "asc" : "desc")}
                            className={`ml-auto inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                                sortOrder === "desc"
                                    ? "bg-yellow-400/10 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/20"
                                    : "bg-card/50 text-muted-foreground border-border/40 hover:text-foreground hover:bg-card/80"
                            }`}
                            title={sortOrder === "desc" ? "Showing highest rated first" : "Showing lowest rated first"}
                        >
                            {sortOrder === "desc" ? (
                                <><ArrowDown className="h-3.5 w-3.5" /> Highest First</>
                            ) : (
                                <><ArrowUp className="h-3.5 w-3.5" /> Lowest First</>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* Table header */}
            <section className="mx-auto max-w-5xl px-4 pb-20">
                {/* Column headers */}
                <div className="hidden sm:grid grid-cols-[56px_48px_1fr_120px_100px] gap-3 px-4 pb-2 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider border-b border-border/30 mb-1">
                    <span>#</span>
                    <span></span>
                    <span>Name</span>
                    <span className="text-center">Genres</span>
                    <button
                        onClick={() => setSortOrder((o) => o === "desc" ? "asc" : "desc")}
                        className="text-right flex items-center justify-end gap-1 hover:text-yellow-400 transition-colors"
                    >
                        Score
                        {sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                    </button>
                </div>

                {loading ? (
                    <div className="space-y-1 mt-1">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-[56px_48px_1fr_100px] gap-3 items-center px-4 py-3 rounded-lg animate-pulse">
                                <div className="h-5 w-8 bg-card/50 rounded" />
                                <div className="w-10 h-14 rounded bg-card/50" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-card/50 rounded w-3/4" />
                                    <div className="h-3 bg-card/50 rounded w-1/2" />
                                </div>
                                <div className="h-6 w-16 bg-card/50 rounded ml-auto" />
                            </div>
                        ))}
                    </div>
                ) : games.length === 0 ? (
                    <div className="text-center py-20">
                        <Gamepad2 className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground text-lg">No games found for these filters.</p>
                        {hasFilters && (
                            <button onClick={clearFilters} className="mt-4 px-4 py-2 rounded-lg bg-card/50 border border-border/50 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-0.5 mt-1">
                        {displayedGames.map((game) => {
                            const isAdded = addedIds.has(game.igdbId);
                            const isAdding = addingId === game.igdbId;
                            const isNavigating = navigatingId === game.igdbId;
                            const year = game.releaseDate ? new Date(game.releaseDate).getFullYear() : null;

                            return (
                                <div
                                    key={game.igdbId}
                                    onClick={() => navigateToGame(game)}
                                    className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg border-l-2 border border-transparent hover:border-border/30 hover:bg-card/40 transition-all duration-150 cursor-pointer ${rankBorderColor(game.rank)}`}
                                >
                                    {/* Rank */}
                                    <div className={`w-10 flex-shrink-0 text-right font-display font-bold text-sm ${rankColor(game.rank)}`}>
                                        {game.rank <= 3 ? (
                                            <div className="flex flex-col items-end">
                                                <Trophy className={`h-4 w-4 ${rankColor(game.rank)}`} />
                                                <span className="text-[10px] font-bold">#{game.rank}</span>
                                            </div>
                                        ) : (
                                            <span>{game.rank}</span>
                                        )}
                                    </div>

                                    {/* Cover */}
                                    <div className="relative w-9 h-12 flex-shrink-0 rounded overflow-hidden bg-card/50">
                                        {isNavigating && (
                                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                                                <Loader2 className="h-3 w-3 text-yellow-400 animate-spin" />
                                            </div>
                                        )}
                                        {game.coverUrl ? (
                                            <Image src={game.coverUrl} alt={game.title} fill className="object-cover" sizes="36px" unoptimized />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Gamepad2 className="h-3 w-3 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Title + meta */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm leading-tight truncate group-hover:text-yellow-400 transition-colors">
                                            {game.title}
                                            {year && <span className="ml-2 text-muted-foreground font-normal text-xs">({year})</span>}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {game.genres.slice(0, 2).join(" · ")}
                                            {game.developers[0] && <span className="ml-2 text-muted-foreground/60">— {game.developers[0]}</span>}
                                        </p>
                                    </div>

                                    {/* Score — "96 / 100" like IGDB */}
                                    {game.rating != null && (
                                        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                            <span className="text-sm font-bold text-yellow-400 tabular-nums">
                                                {game.rating}
                                            </span>
                                            <span className="text-xs text-muted-foreground/50">/ 100</span>
                                        </div>
                                    )}

                                    {/* Add Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (!isAdded && !isAdding) addToLibrary(game); }}
                                        disabled={isAdded || isAdding}
                                        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                            isAdded
                                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                : "bg-transparent text-muted-foreground border-border/30 hover:text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400/20"
                                        }`}
                                    >
                                        {isAdding ? <><Loader2 className="h-3 w-3 animate-spin" /> Adding</>
                                            : isAdded ? <><Check className="h-3 w-3" /> Added</>
                                            : <><Plus className="h-3 w-3" /> Add</>}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
