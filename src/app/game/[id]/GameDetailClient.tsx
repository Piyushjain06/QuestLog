"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ExternalLink,
    Clock,
    Star,
    Calendar,
    Code2,
    Building2,
    HelpCircle,
    Plus,
    Loader2,
    Check,
    Trash2,
    Edit3,
    ShoppingCart,
    Heart,
    Sparkles,
    ShieldAlert,
    ImageIcon,
    Play,
    ChevronLeft,
    ChevronRight,
    X,
    Globe,
    Monitor,
    Gamepad,
    Youtube,
    Twitter,
    Facebook,
    Twitch,
    Instagram,
    Github,
    Smartphone,
    MessageSquare,
    Apple
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MissionList } from "@/components/MissionList";
import { parseJsonField, formatPlaytime } from "@/lib/utils";

interface Game {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverUrl: string | null;
    bannerUrl: string | null;
    steamAppId: string | null;
    igdbId: string | null;
    genres: string;
    tags: string;
    platforms: string;
    releaseDate: string | null;
    developer: string | null;
    publisher: string | null;
    rating: number | null;
}

interface Mission {
    id: string;
    title: string;
    description: string | null;
    type: string;
    difficulty: string | null;
    xpReward: number;
    completed: boolean;
}

interface LibraryEntry {
    id: string;
    status: string;
    playtimeHrs: number;
    userRating: number | null;
    favorite: boolean;
}

interface SimilarGame {
    id?: string;
    igdbId?: number;
    title: string;
    coverUrl: string | null;
    genres: string[];
    themes?: string[];
    tags?: string[];
    score?: number;
    rating?: string | null;
}

interface IGDBReleaseDate {
    platform: string;
    date: string;
    year: number;
}

interface IGDBWebsite {
    category: number;
    url: string;
}

interface IGDBTimeToBeat {
    hastily: number;
    normally: number;
    completely: number;
}

interface ExtendedGameDetails {
    releases: IGDBReleaseDate[];
    websites: IGDBWebsite[];
    timeToBeat: IGDBTimeToBeat | null;
}

interface GameDetailClientProps {
    game: Game;
    missions: Mission[];
    libraryEntry: LibraryEntry | null;
    isLoggedIn: boolean;
    similarGames: SimilarGame[];
    extendedDetails?: ExtendedGameDetails;
}

export function GameDetailClient({ game, missions, libraryEntry, isLoggedIn, similarGames, extendedDetails }: GameDetailClientProps) {
    const genres = parseJsonField<string[]>(game.genres, []);
    const tags = parseJsonField<string[]>(game.tags, []);
    const platforms = parseJsonField<string[]>(game.platforms, []);
    const [currentStatus, setCurrentStatus] = useState(libraryEntry?.status ?? "BACKLOG");
    const [inLibrary, setInLibrary] = useState(!!libraryEntry);
    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [isFavorite, setIsFavorite] = useState(libraryEntry?.favorite ?? false);
    const [playtime, setPlaytime] = useState(libraryEntry?.playtimeHrs ?? 0);
    const [editingPlaytime, setEditingPlaytime] = useState(false);
    const [playtimeInput, setPlaytimeInput] = useState(String(libraryEntry?.playtimeHrs ?? 0));
    const [trailerVideoId, setTrailerVideoId] = useState<string | null>(null);
    const [trailerLoading, setTrailerLoading] = useState(true);
    const [rating, setRating] = useState<number | null>(libraryEntry?.userRating ?? null);
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const [mediaTab, setMediaTab] = useState<"trailer" | "screenshots">("trailer");
    const [screenshots, setScreenshots] = useState<string[]>([]);
    const [screenshotsLoading, setScreenshotsLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // NSFW age-gate
    const nsfwKeywords = ["erotic", "sexual content", "nudity", "hentai"];
    const isNsfw = [...genres, ...tags].some((t) =>
        nsfwKeywords.some((kw) => t.toLowerCase().includes(kw))
    );
    const [nsfwConfirmed, setNsfwConfirmed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchTrailer = async () => {
            try {
                const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(game.title + " official game trailer")}`);
                const data = await res.json();
                if (data.videoId) {
                    setTrailerVideoId(data.videoId);
                }
            } catch {
                // Silently fail
            } finally {
                setTrailerLoading(false);
            }
        };

        const fetchScreenshots = async () => {
            if (!game.igdbId) {
                setScreenshotsLoading(false);
                return;
            }
            try {
                const res = await fetch(`/api/igdb/screenshots?igdbId=${game.igdbId}`);
                const data = await res.json();
                if (data.images && data.images.length > 0) {
                    setScreenshots(data.images.map((id: string) => `${data.baseUrl}${id}.jpg`));
                }
            } catch {
                // Silently fail
            } finally {
                setScreenshotsLoading(false);
            }
        };

        fetchTrailer();
        fetchScreenshots();
    }, [game.title, game.igdbId]);

    const handleAddToLibrary = async () => {
        setAdding(true);
        try {
            const res = await fetch("/api/games", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: game.id, status: "BACKLOG" }),
            });
            if (res.ok) {
                setInLibrary(true);
                setCurrentStatus("BACKLOG");
            }
        } catch {
            // Silently fail
        } finally {
            setAdding(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        setCurrentStatus(newStatus);
        try {
            await fetch("/api/games", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: game.id, status: newStatus }),
            });
        } catch {
            // Silently fail
        }
    };

    const handleRemoveFromLibrary = async () => {
        setRemoving(true);
        try {
            const res = await fetch("/api/games", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: game.id }),
            });
            if (res.ok) {
                setInLibrary(false);
                setShowRemoveConfirm(false);
            }
        } catch {
            // Silently fail
        } finally {
            setRemoving(false);
        }
    };

    const handleToggleFavorite = async () => {
        const newVal = !isFavorite;
        setIsFavorite(newVal);
        try {
            await fetch("/api/games", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: game.id, favorite: newVal }),
            });
        } catch {
            setIsFavorite(!newVal);
        }
    };

    const handleMissionToggle = async (missionId: string, completed: boolean) => {
        try {
            await fetch("/api/missions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId, completed }),
            });
        } catch {
            // Silently fail for demo
        }
    };

    const walkthroughUrl = `https://duckduckgo.com/?q=${encodeURIComponent(
        game.title + " walkthrough guide"
    )}`;

    const handleRatingClick = async (value: number) => {
        const newRating = rating === value ? null : value;
        setRating(newRating);
        try {
            await fetch("/api/games", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gameId: game.id, userRating: newRating }),
            });
        } catch {
            setRating(rating);
        }
    };

    const statusButtons = [
        { value: "PLAYING", label: "Playing", variant: "playing" as const },
        { value: "COMPLETED", label: "Completed", variant: "completed" as const },
        { value: "BACKLOG", label: "Backlog", variant: "backlog" as const },
        { value: "DROPPED", label: "Dropped", variant: "dropped" as const },
    ];

    // Show NSFW gate if needed
    if (isNsfw && !nsfwConfirmed) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
                {/* Glow background effect */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-500/5 blur-[120px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-neon-purple/5 blur-[80px]" />
                </div>

                <div className="relative glass-card max-w-md w-full p-10 text-center space-y-8 border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.08)]">
                    {/* Animated icon */}
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-neon-purple/20 border border-red-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.15)] animate-pulse">
                        <ShieldAlert className="h-10 w-10 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    </div>

                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1.5 text-sm text-red-400">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            NSFW Content
                        </div>
                        <h2 className="text-3xl font-display font-bold">
                            <span className="bg-gradient-to-r from-red-400 to-neon-purple bg-clip-text text-transparent">
                                18+ Content Warning
                            </span>
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-neon-cyan">{game.title}</span> contains mature/adult content
                            that may not be suitable for all audiences.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <button
                            onClick={() => setNsfwConfirmed(true)}
                            className="w-full px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-500/80 to-neon-purple/80 text-white font-semibold hover:from-red-500 hover:to-neon-purple transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_30px_rgba(239,68,68,0.35)]"
                        >
                            I am 18+ — Continue
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="w-full px-6 py-3.5 rounded-xl border border-border/50 text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all duration-200"
                        >
                            Go Back
                        </button>
                    </div>

                    <p className="text-xs text-muted-foreground/40">
                        By continuing, you confirm you are at least 18 years old.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Back button */}
            <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Library
                </Button>
            </Link>

            {/* Hero section */}
            <div className="relative glass-card overflow-hidden">
                {/* Banner background */}
                <div className="absolute inset-0 overflow-hidden">
                    {game.coverUrl ? (
                        <Image
                            src={game.coverUrl}
                            alt=""
                            fill
                            className="object-cover blur-2xl opacity-20 scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                </div>

                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
                    {/* Cover art */}
                    <div className="shrink-0 w-40 sm:w-52">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                            {game.coverUrl ? (
                                <Image
                                    src={game.coverUrl}
                                    alt={game.title}
                                    width={208}
                                    height={277}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-muted to-background flex items-center justify-center">
                                    <span className="text-5xl font-display font-bold text-muted-foreground/30">
                                        {game.title.charAt(0)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">{game.title}</h1>
                            {game.description && (
                                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                                    {game.description}
                                </p>
                            )}
                        </div>

                        {/* Genres */}
                        <div className="flex flex-wrap gap-2">
                            {genres.map((genre) => (
                                <Badge key={genre} variant="outline">
                                    {genre}
                                </Badge>
                            ))}
                        </div>

                        {/* Themes */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-neon-purple uppercase tracking-wider">Themes</span>
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="border-neon-purple/30 text-neon-purple bg-neon-purple/5">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Meta info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            {game.developer && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Code2 className="h-4 w-4 text-neon-cyan" />
                                    <span>{game.developer}</span>
                                </div>
                            )}
                            {game.publisher && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Building2 className="h-4 w-4 text-neon-purple" />
                                    <span>{game.publisher}</span>
                                </div>
                            )}
                            {game.releaseDate && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4 text-neon-orange" />
                                    <span>{game.releaseDate}</span>
                                </div>
                            )}
                            {game.rating && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Star className="h-4 w-4 text-neon-orange fill-neon-orange" />
                                    <span>{game.rating.toFixed(1)}/10</span>
                                </div>
                            )}
                        </div>

                        {/* User stats — playtime + rating */}
                        {inLibrary && (
                            <div className="flex flex-wrap items-center gap-4">
                                {editingPlaytime ? (
                                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                                        <Clock className="h-5 w-5 text-neon-cyan" />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={playtimeInput}
                                            onChange={(e) => setPlaytimeInput(e.target.value)}
                                            onBlur={() => {
                                                const hrs = parseFloat(playtimeInput) || 0;
                                                setPlaytime(hrs);
                                                setEditingPlaytime(false);
                                                fetch("/api/games", {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ gameId: game.id, playtimeHrs: hrs }),
                                                });
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                                if (e.key === "Escape") {
                                                    setPlaytimeInput(String(playtime));
                                                    setEditingPlaytime(false);
                                                }
                                            }}
                                            autoFocus
                                            className="w-20 bg-transparent border border-neon-cyan/50 rounded-lg px-2 py-1 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
                                        />
                                        <span className="text-sm font-medium text-neon-cyan">hours played</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setPlaytimeInput(String(playtime));
                                            setEditingPlaytime(true);
                                        }}
                                        className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 hover:border-neon-cyan/40 hover:bg-neon-cyan/15 hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] transition-all duration-200 group/pt"
                                    >
                                        <Clock className="h-5 w-5 text-neon-cyan" />
                                        <span className="text-base font-bold text-foreground">{formatPlaytime(playtime)}</span>
                                        <span className="text-sm text-muted-foreground">played</span>
                                        <Edit3 className="h-3.5 w-3.5 text-neon-cyan/60 group-hover/pt:text-neon-cyan transition-colors ml-1" />
                                    </button>
                                )}

                                {/* Star Rating (half-star support) */}
                                <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neon-orange/5 border border-neon-orange/10">
                                    <span className="text-sm text-muted-foreground mr-1">Your Rating</span>
                                    <div className="flex items-center">
                                        {[1, 2, 3, 4, 5].map((starIndex) => {
                                            const activeRating = hoverRating ?? rating ?? 0;
                                            const full = activeRating >= starIndex;
                                            const half = !full && activeRating >= starIndex - 0.5;
                                            return (
                                                <div key={starIndex} className="relative w-6 h-6 cursor-pointer group/star">
                                                    {/* Left half = half star (e.g., 0.5, 1.5 ...) */}
                                                    <button
                                                        className="absolute inset-y-0 left-0 w-1/2 z-10"
                                                        onClick={() => handleRatingClick(starIndex - 0.5)}
                                                        onMouseEnter={() => setHoverRating(starIndex - 0.5)}
                                                        onMouseLeave={() => setHoverRating(null)}
                                                        title={`${starIndex - 0.5}/5`}
                                                    />
                                                    {/* Right half = full star (e.g., 1, 2 ...) */}
                                                    <button
                                                        className="absolute inset-y-0 right-0 w-1/2 z-10"
                                                        onClick={() => handleRatingClick(starIndex)}
                                                        onMouseEnter={() => setHoverRating(starIndex)}
                                                        onMouseLeave={() => setHoverRating(null)}
                                                        title={`${starIndex}/5`}
                                                    />
                                                    {/* Star visual */}
                                                    <div className="relative w-6 h-6 transition-transform duration-150 group-hover/star:scale-110">
                                                        {/* Empty star (background) */}
                                                        <Star className="absolute inset-0 h-6 w-6 text-muted-foreground/20" />
                                                        {/* Filled portion */}
                                                        {(full || half) && (
                                                            <div
                                                                className="absolute inset-0 overflow-hidden"
                                                                style={{ width: full ? '100%' : '50%' }}
                                                            >
                                                                <Star className="h-6 w-6 text-neon-orange fill-neon-orange drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {rating !== null && (
                                        <span className="text-sm font-bold text-neon-orange ml-2">{rating % 1 === 0 ? rating.toFixed(0) : rating.toFixed(1)}/5</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Add to Library / Status buttons */}
                        {isLoggedIn && !inLibrary ? (
                            <Button
                                onClick={handleAddToLibrary}
                                disabled={adding}
                                className="gap-2 bg-gradient-to-r from-neon-cyan to-neon-cyan/80 text-background font-semibold hover:brightness-110 transition-all"
                                size="lg"
                            >
                                {adding ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                                ) : (
                                    <><Plus className="h-4 w-4" /> Add to Library</>
                                )}
                            </Button>
                        ) : inLibrary ? (
                            <div className="flex flex-wrap gap-2 items-center">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowRemoveConfirm(!showRemoveConfirm)}
                                        className="flex items-center gap-1.5 mr-2 px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200 group/lib"
                                    >
                                        <Check className="h-4 w-4 text-green-400 group-hover/lib:hidden" />
                                        <Trash2 className="h-4 w-4 text-red-400 hidden group-hover/lib:block" />
                                        <span className="text-sm font-medium text-green-400 group-hover/lib:text-red-400 transition-colors">
                                            {showRemoveConfirm ? "Cancel" : "In Library"}
                                        </span>
                                    </button>
                                    {showRemoveConfirm && (
                                        <div className="absolute top-full left-0 mt-2 z-10 animate-fade-in">
                                            <button
                                                onClick={handleRemoveFromLibrary}
                                                disabled={removing}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all whitespace-nowrap"
                                            >
                                                {removing ? (
                                                    <><Loader2 className="h-4 w-4 animate-spin" /> Removing...</>
                                                ) : (
                                                    <><Trash2 className="h-4 w-4" /> Remove from Library</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {/* Favorite toggle */}
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 ${isFavorite
                                        ? "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                        : "border-border bg-transparent text-muted-foreground hover:border-red-500/30 hover:text-red-400"
                                        }`}
                                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                    <Heart className={`h-4 w-4 transition-all duration-200 ${isFavorite ? "fill-red-400" : ""}`} />
                                    <span className="text-sm font-medium">{isFavorite ? "Favorited" : "Favorite"}</span>
                                </button>
                                {statusButtons.map((btn) => (
                                    <button
                                        key={btn.value}
                                        onClick={() => handleStatusChange(btn.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${currentStatus === btn.value
                                            ? "bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan"
                                            : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/50"
                                            }`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        ) : !isLoggedIn ? (
                            <Link href="/auth">
                                <Button
                                    className="gap-2 bg-gradient-to-r from-neon-cyan to-neon-cyan/80 text-background font-semibold"
                                    size="lg"
                                >
                                    <Plus className="h-4 w-4" /> Sign in to Add
                                </Button>
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Media Section — Trailer & Screenshots */}
            <div className="space-y-4">
                {/* Tab buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMediaTab("trailer")}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${mediaTab === "trailer"
                            ? "bg-red-500/15 text-red-400 border-red-500/30 shadow-sm shadow-red-500/10"
                            : "bg-card/50 text-muted-foreground border-white/5 hover:bg-card/80 hover:text-foreground"
                            }`}
                    >
                        <Play className="h-4 w-4" />
                        Trailer
                    </button>
                    <button
                        onClick={() => setMediaTab("screenshots")}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${mediaTab === "screenshots"
                            ? "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30 shadow-sm shadow-neon-cyan/10"
                            : "bg-card/50 text-muted-foreground border-white/5 hover:bg-card/80 hover:text-foreground"
                            }`}
                    >
                        <ImageIcon className="h-4 w-4" />
                        Screenshots
                        {screenshots.length > 0 && (
                            <span className="text-xs bg-neon-cyan/20 px-1.5 py-0.5 rounded-full">{screenshots.length}</span>
                        )}
                    </button>
                </div>

                {/* Trailer Tab */}
                {mediaTab === "trailer" && (
                    <div className="space-y-3 animate-fade-in">
                        {trailerLoading ? (
                            <div className="glass-card rounded-xl flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
                                    <span className="text-sm">Loading trailer...</span>
                                </div>
                            </div>
                        ) : trailerVideoId ? (
                            <div className="glass-card overflow-hidden rounded-xl">
                                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                    <iframe
                                        className="absolute inset-0 w-full h-full"
                                        src={`https://www.youtube-nocookie.com/embed/${trailerVideoId}?rel=0`}
                                        title={`${game.title} Trailer`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card rounded-xl p-8 flex flex-col items-center gap-3">
                                <svg className="h-12 w-12 text-muted-foreground/50" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                                <p className="text-sm text-muted-foreground">No trailer found</p>
                            </div>
                        )}
                        <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(game.title + " official trailer")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Watch more on YouTube
                        </a>
                    </div>
                )}

                {/* Screenshots Tab */}
                {mediaTab === "screenshots" && (
                    <div className="space-y-3 animate-fade-in">
                        {screenshotsLoading ? (
                            <div className="glass-card rounded-xl flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                    <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
                                    <span className="text-sm">Loading screenshots...</span>
                                </div>
                            </div>
                        ) : screenshots.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {screenshots.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setLightboxIndex(idx)}
                                        className="relative aspect-video rounded-xl overflow-hidden glass-card border border-border/30 hover:border-neon-cyan/40 transition-all duration-300 group cursor-pointer"
                                    >
                                        <Image
                                            src={url}
                                            alt={`${game.title} screenshot ${idx + 1}`}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 768px) 50vw, 33vw"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="glass-card rounded-xl p-8 flex flex-col items-center gap-3">
                                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">No screenshots available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Screenshot Lightbox */}
            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in"
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
                    >
                        <X className="h-6 w-6" />
                    </button>
                    {lightboxIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                            className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>
                    )}
                    {lightboxIndex < screenshots.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                            className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    )}
                    <div className="relative w-[90vw] max-w-5xl aspect-video" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={screenshots[lightboxIndex]}
                            alt={`${game.title} screenshot ${lightboxIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="90vw"
                            unoptimized
                        />
                    </div>
                    <div className="absolute bottom-4 text-white/60 text-sm">
                        {lightboxIndex + 1} / {screenshots.length}
                    </div>
                </div>
            )}

            {/* Content grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Missions (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-display font-bold">Missions</h2>
                        {missions.length > 0 && (
                            <Badge variant="outline">{missions.length} objectives</Badge>
                        )}
                    </div>

                    {missions.length > 0 ? (
                        <MissionList missions={missions} onToggle={handleMissionToggle} />
                    ) : (
                        <div className="glass-card p-8 text-center">
                            <p className="text-muted-foreground">No missions defined for this game yet.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar (1/3 width) */}
                <div className="space-y-4">
                    {/* Buy / Store Links */}
                    <div className="glass-card p-4 space-y-3">
                        <h3 className="font-display font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-neon-cyan" />
                            Get the Game
                        </h3>
                        <div className="space-y-2">
                            <a
                                href={game.steamAppId
                                    ? `https://store.steampowered.com/app/${game.steamAppId}`
                                    : `https://store.steampowered.com/search/?term=${encodeURIComponent(game.title)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" className="w-full gap-2 justify-start">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .127.003.19.008l2.861-4.142V8.91a4.528 4.528 0 0 1 4.524-4.524c2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396a3.406 3.406 0 0 1-3.362-2.898L.309 15.044C1.59 20.152 6.293 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0z" />
                                    </svg>
                                    View on Steam
                                </Button>
                            </a>
                            <a href={walkthroughUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="w-full gap-2 justify-start mt-2">
                                    <HelpCircle className="h-4 w-4" />
                                    Find Walkthrough
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Extended Details UI */}
                    {extendedDetails && (
                        <div className="space-y-4">
                            {/* Releases */}
                            {extendedDetails.releases.length > 0 && (
                                <div className="glass-card p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-display font-semibold flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-neon-orange" />
                                            Releases
                                        </h3>
                                    </div>
                                    <div className="space-y-1.5">
                                        {extendedDetails.releases.slice(0, 4).map((r, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">{r.platform}</span>
                                                <span className="font-semibold">{r.date}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Time to Beat */}
                            {extendedDetails.timeToBeat && (
                                <div className="glass-card p-4 space-y-3">
                                    <h3 className="font-display font-semibold flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-neon-purple" />
                                        Time to beat
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">Hastily</div>
                                            <div className="bg-neon-purple/20 text-neon-purple font-bold py-2 rounded-lg text-lg">
                                                {Math.round(extendedDetails.timeToBeat.hastily / 3600)} H
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">Normally</div>
                                            <div className="bg-neon-purple/20 text-neon-purple font-bold py-2 rounded-lg text-lg">
                                                {Math.round(extendedDetails.timeToBeat.normally / 3600)} H
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">Completely</div>
                                            <div className="bg-neon-purple/20 text-neon-purple font-bold py-2 rounded-lg text-lg">
                                                {Math.round(extendedDetails.timeToBeat.completely / 3600)} H
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Links */}
                            {extendedDetails.websites.length > 0 && (
                                <div className="glass-card p-4 space-y-3">
                                    <h3 className="font-display font-semibold flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-neon-cyan" />
                                        Links
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {extendedDetails.websites.map((w, i) => {
                                            // Provide simple icon overrides based on typical IGDB categories or URL matches
                                            let IconComp = ExternalLink;
                                            let bgClass = "bg-card hover:bg-muted";
                                            if (w.url.includes("steam")) { IconComp = Monitor; bgClass = "bg-[#171a21]/50 hover:bg-[#171a21] text-white"; }
                                            else if (w.url.includes("epicgames")) { IconComp = Monitor; bgClass = "bg-[#2a2a2a]/50 hover:bg-[#2a2a2a] text-white"; }
                                            else if (w.url.includes("xbox")) { IconComp = Gamepad; bgClass = "bg-[#107C10]/20 hover:bg-[#107C10]/40 text-[#107C10]"; }
                                            else if (w.url.includes("playstation")) { IconComp = Gamepad; bgClass = "bg-[#00439C]/20 hover:bg-[#00439C]/40 text-[#00439C]"; }
                                            else if (w.url.includes("nintendo")) { IconComp = Gamepad; bgClass = "bg-[#E60012]/20 hover:bg-[#E60012]/40 text-[#E60012]"; }
                                            else if (w.url.includes("twitter") || w.url.includes("x.com")) { IconComp = Twitter; bgClass = "bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/40 text-[#1DA1F2]"; }
                                            else if (w.url.includes("facebook")) { IconComp = Facebook; bgClass = "bg-[#4267B2]/20 hover:bg-[#4267B2]/40 text-[#4267B2]"; }
                                            else if (w.url.includes("youtube")) { IconComp = Youtube; bgClass = "bg-[#FF0000]/20 hover:bg-[#FF0000]/40 text-[#FF0000]"; }
                                            else if (w.url.includes("twitch")) { IconComp = Twitch; bgClass = "bg-[#9146FF]/20 hover:bg-[#9146FF]/40 text-[#9146FF]"; }
                                            else if (w.url.includes("instagram")) { IconComp = Instagram; bgClass = "bg-[#E1306C]/20 hover:bg-[#E1306C]/40 text-[#E1306C]"; }
                                            else if (w.url.includes("github")) { IconComp = Github; bgClass = "bg-[#333]/50 hover:bg-[#333] text-white"; }
                                            else if (w.url.includes("discord")) { IconComp = MessageSquare; bgClass = "bg-[#5865F2]/20 hover:bg-[#5865F2]/40 text-[#5865F2]"; }
                                            else if (w.url.includes("reddit")) { IconComp = MessageSquare; bgClass = "bg-[#FF4500]/20 hover:bg-[#FF4500]/40 text-[#FF4500]"; }
                                            else if (w.url.includes("wikipedia") || w.url.includes("wikia") || w.url.includes("fandom")) { IconComp = Globe; bgClass = "bg-card hover:bg-muted text-muted-foreground"; }
                                            else if (w.url.match(/apple|ios|ipad|iphone|itunes/i)) { IconComp = Apple; bgClass = "bg-[#A2AAAD]/20 hover:bg-[#A2AAAD]/40 text-[#A2AAAD]"; }
                                            else if (w.url.match(/android|google|play\.google/i)) { IconComp = Smartphone; bgClass = "bg-[#3DDC84]/20 hover:bg-[#3DDC84]/40 text-[#3DDC84]"; }

                                            return (
                                                <a key={i} href={w.url} target="_blank" rel="noopener noreferrer"
                                                    className={`p-2.5 rounded-lg border border-border/50 transition-colors ${bgClass}`}
                                                    title={w.url}>
                                                    <IconComp className="h-5 w-5" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Similar Games */}
            {similarGames.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-neon-purple" />
                        <h2 className="text-xl font-display font-bold">Similar Games</h2>
                        <Badge variant="outline" className="ml-auto">
                            {similarGames.length} found
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {similarGames.map((sg, idx) => {
                            const ratingDisplay = sg.rating
                                ? `★ ${parseFloat(sg.rating).toFixed(0)}%`
                                : sg.score
                                    ? `${Math.min(Math.round(sg.score * 100), 99)}%`
                                    : null;
                            const href = sg.id ? `/game/${sg.id}` : `/discover`;
                            return (
                                <Link key={sg.igdbId ?? sg.id ?? idx} href={href}>
                                    <div className="group glass-card game-card-hover overflow-hidden cursor-pointer">
                                        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                                            {sg.coverUrl ? (
                                                <Image
                                                    src={sg.coverUrl}
                                                    alt={sg.title}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20">
                                                    <span className="text-4xl font-display font-bold text-muted-foreground/30">
                                                        {sg.title.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                            {ratingDisplay && (
                                                <div className="absolute top-2 left-2">
                                                    <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                                        <Sparkles className="h-3 w-3 text-neon-purple" />
                                                        <span className="text-xs font-bold text-neon-cyan">{ratingDisplay}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3 space-y-1.5">
                                            <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-neon-cyan transition-colors">
                                                {sg.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-1">
                                                {sg.genres.slice(0, 2).map((genre) => (
                                                    <Badge key={genre} variant="outline" className="text-[10px] px-1.5 py-0">
                                                        {genre}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )
            }
        </div >
    );
}
