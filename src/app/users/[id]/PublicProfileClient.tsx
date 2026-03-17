"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GameCard } from "@/components/GameCard";
import { Badge } from "@/components/ui/badge";
import type { GameStatus } from "@/lib/utils";
import {
    Gamepad2,
    Trophy,
    XCircle,
    Clock,
    LayoutGrid,
    User,
    CalendarDays,
    Timer,
    Star,
    Activity,
    Heart,
    UserPlus,
    Check,
    Loader2,
    ArrowLeft,
} from "lucide-react";

interface Game {
    id: string;
    title: string;
    coverUrl: string | null;
    genres: string;
    platforms: string;
}

interface LibraryEntry {
    id: string;
    status: string;
    playtimeHrs: number;
    userRating: number | null;
    favorite: boolean;
    updatedAt: string;
    createdAt: string;
    game: Game;
}

interface PublicProfileProps {
    userId: string;
    initialUser: {
        id: string;
        name: string;
        image: string | null;
        bio: string;
        joinedAt: string;
    };
    initialLibrary: LibraryEntry[];
    initialFriendshipStatus: string | null;
    initialFriendshipId: string | null;
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

function statusLabel(status: string): string {
    switch (status) {
        case "PLAYING": return "Currently playing";
        case "COMPLETED": return "Completed";
        case "DROPPED": return "Dropped";
        case "BACKLOG": return "Added to backlog";
        case "PLANNING": return "Added to planning";
        default: return "Updated";
    }
}

function statusColor(status: string): string {
    switch (status) {
        case "PLAYING": return "text-green-400";
        case "COMPLETED": return "text-neon-cyan";
        case "DROPPED": return "text-red-400";
        case "BACKLOG": return "text-yellow-400";
        case "PLANNING": return "text-violet-400";
        default: return "text-muted-foreground";
    }
}

export function PublicProfileClient({
    userId,
    initialUser,
    initialLibrary,
    initialFriendshipStatus,
    initialFriendshipId,
}: PublicProfileProps) {
    const user = initialUser;
    const library = initialLibrary;
    const [friendStatus, setFriendStatus] = useState(initialFriendshipStatus);
    const [friendLoading, setFriendLoading] = useState(false);

    // Stats
    const statusCounts = {
        ALL: library.length,
        PLAYING: library.filter((e) => e.status === "PLAYING").length,
        COMPLETED: library.filter((e) => e.status === "COMPLETED").length,
        DROPPED: library.filter((e) => e.status === "DROPPED").length,
        BACKLOG: library.filter((e) => e.status === "BACKLOG").length,
        PLANNING: library.filter((e) => e.status === "PLANNING").length,
    };

    const totalPlaytime = library.reduce((sum, e) => sum + e.playtimeHrs, 0);
    const ratedGames = library.filter((e) => e.userRating !== null);
    const meanScore = ratedGames.length > 0
        ? ratedGames.reduce((sum, e) => sum + (e.userRating ?? 0), 0) / ratedGames.length
        : 0;

    const favorites = library.filter((e) => e.favorite);

    const recentActivity = [...library]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8);

    const joinDate = new Date(user.joinedAt);
    const memberSince = joinDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const handleAddFriend = async () => {
        if (friendLoading || friendStatus) return;
        setFriendLoading(true);
        try {
            const res = await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId: userId }),
            });
            if (res.ok) {
                setFriendStatus("PENDING");
            }
        } catch {
            // silently fail
        } finally {
            setFriendLoading(false);
        }
    };

    return (
        <div className="space-y-0">
            {/* ═══════ BANNER ═══════ */}
            <div className="relative w-full h-48 sm:h-56 md:h-64 bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 dark:from-[#0a1628] dark:via-[#0d2847] dark:to-[#0a1628] overflow-hidden -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10 px-0" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-30 dark:opacity-20">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(59,130,246,0.2) 0%, transparent 50%), 
                                          radial-gradient(circle at 80% 50%, rgba(99,102,241,0.15) 0%, transparent 50%),
                                          linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.08) 100%)`
                    }} />
                </div>

                {/* Back button */}
                <Link
                    href="/users"
                    className="absolute top-4 left-4 md:left-12 lg:left-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-foreground/70 hover:text-foreground bg-background/40 hover:bg-background/60 backdrop-blur-sm transition-all z-10 border border-border/30"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>

                {/* User info overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 lg:px-20 pb-4 flex items-end gap-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl border-4 border-background/80 bg-gradient-to-br from-neon-cyan/30 to-neon-orange/20 flex items-center justify-center shadow-xl overflow-hidden">
                            {user.image ? (
                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl sm:text-5xl font-display font-bold text-neon-cyan/80">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-400 border-3 border-background" />
                    </div>

                    {/* Name & meta */}
                    <div className="pb-1 min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground truncate">
                            {user.name}
                        </h1>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Joined {memberSince}
                            </span>
                            <span className="hidden sm:flex items-center gap-1.5">
                                <Gamepad2 className="h-3.5 w-3.5" />
                                {library.length} games
                            </span>
                        </div>
                    </div>

                    {/* Friend action button */}
                    <div className="flex-shrink-0 pb-2">
                        {friendStatus === "ACCEPTED" ? (
                            <span className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
                                <Check className="h-4 w-4" />
                                Friends
                            </span>
                        ) : friendStatus === "PENDING" ? (
                            <span className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                                <Clock className="h-4 w-4" />
                                Pending
                            </span>
                        ) : (
                            <button
                                onClick={handleAddFriend}
                                disabled={friendLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 hover:border-blue-400/35 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-500/10"
                            >
                                {friendLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <UserPlus className="h-4 w-4" />
                                )}
                                Add Friend
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════ CONTENT ═══════ */}
            <div className="pt-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* LEFT: About */}
                    <div className="space-y-6">
                        {/* About card */}
                        <div className="glass-card p-5 space-y-4">
                            <h3 className="font-display font-semibold flex items-center gap-2">
                                <User className="h-5 w-5 text-neon-cyan" />
                                About
                            </h3>
                            <div className="space-y-3 text-sm text-muted-foreground">
                                <p className="whitespace-pre-wrap">{user.bio || "No bio yet 🎮"}</p>
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-neon-orange" />
                                    <span>Member since {memberSince}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4 text-neon-orange" />
                                    <span>{library.length} games in library</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Timer className="h-4 w-4 text-neon-orange" />
                                    <span>{Math.round(totalPlaytime)} hours played</span>
                                </div>
                            </div>
                        </div>

                        {/* Favorite games */}
                        <div className="glass-card p-5 space-y-3">
                            <h3 className="font-display font-semibold flex items-center gap-2">
                                <Heart className="h-5 w-5 text-red-400" />
                                Favorite Games
                            </h3>
                            {favorites.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {favorites.slice(0, 6).map((entry) => (
                                        <Link key={entry.id} href={`/game/${entry.game.id}`}>
                                            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted/50 hover:ring-2 hover:ring-red-400/50 transition-all cursor-pointer relative group">
                                                {entry.game.coverUrl ? (
                                                    <img
                                                        src={entry.game.coverUrl}
                                                        alt={entry.game.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground/30">
                                                        {entry.game.title.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-[10px] text-white truncate">{entry.game.title}</p>
                                                </div>
                                                <Heart className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-red-400 fill-red-400" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No favorites yet.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Stats + Activity + Game Library */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats row */}
                        <div className="glass-card p-5">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-display font-bold text-neon-cyan">
                                        {library.length}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Total Games</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-display font-bold text-neon-cyan">
                                        {Math.round(totalPlaytime)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Hours Played</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-display font-bold text-neon-cyan">
                                        {statusCounts.COMPLETED}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Completed</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl font-display font-bold text-neon-cyan">
                                        {meanScore > 0 ? meanScore.toFixed(1) : "—"}<span className="text-base font-normal text-muted-foreground">{meanScore > 0 ? "/5" : ""}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">Mean Score</div>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-5">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                    <span>Library Progress</span>
                                    <span>{statusCounts.COMPLETED} / {library.length} completed</span>
                                </div>
                                <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden flex">
                                    {statusCounts.COMPLETED > 0 && (
                                        <div
                                            className="h-full bg-neon-cyan rounded-l-full transition-all duration-500"
                                            style={{ width: `${(statusCounts.COMPLETED / Math.max(library.length, 1)) * 100}%` }}
                                        />
                                    )}
                                    {statusCounts.PLAYING > 0 && (
                                        <div
                                            className="h-full bg-green-500 transition-all duration-500"
                                            style={{ width: `${(statusCounts.PLAYING / Math.max(library.length, 1)) * 100}%` }}
                                        />
                                    )}
                                    {statusCounts.BACKLOG > 0 && (
                                        <div
                                            className="h-full bg-yellow-500 transition-all duration-500"
                                            style={{ width: `${(statusCounts.BACKLOG / Math.max(library.length, 1)) * 100}%` }}
                                        />
                                    )}
                                    {statusCounts.PLANNING > 0 && (
                                        <div
                                            className="h-full bg-violet-500 transition-all duration-500"
                                            style={{ width: `${(statusCounts.PLANNING / Math.max(library.length, 1)) * 100}%` }}
                                        />
                                    )}
                                    {statusCounts.DROPPED > 0 && (
                                        <div
                                            className="h-full bg-red-500 rounded-r-full transition-all duration-500"
                                            style={{ width: `${(statusCounts.DROPPED / Math.max(library.length, 1)) * 100}%` }}
                                        />
                                    )}
                                </div>
                                <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-cyan inline-block" />Completed ({statusCounts.COMPLETED})</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Playing ({statusCounts.PLAYING})</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />Backlog ({statusCounts.BACKLOG})</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />Planning ({statusCounts.PLANNING})</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Dropped ({statusCounts.DROPPED})</span>
                                </div>
                            </div>
                        </div>

                        {/* Activity feed */}
                        <div className="space-y-4">
                            <h3 className="font-display font-semibold flex items-center gap-2 text-lg">
                                <Activity className="h-5 w-5 text-neon-cyan" />
                                Recent Activity
                            </h3>

                            {recentActivity.length > 0 ? (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {recentActivity.map((entry) => (
                                        <Link key={entry.id} href={`/game/${entry.game.id}`}>
                                            <div className="glass-card p-3 flex items-center gap-3 hover:border-neon-cyan/30 transition-all duration-200 cursor-pointer group">
                                                <div className="w-12 h-16 rounded-md overflow-hidden bg-muted/50 flex-shrink-0">
                                                    {entry.game.coverUrl ? (
                                                        <img
                                                            src={entry.game.coverUrl}
                                                            alt={entry.game.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground/30">
                                                            {entry.game.title.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-medium ${statusColor(entry.status)}`}>
                                                        {statusLabel(entry.status)}
                                                    </p>
                                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-neon-cyan transition-colors">
                                                        {entry.game.title}
                                                    </p>
                                                    {entry.playtimeHrs > 0 && (
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {Math.round(entry.playtimeHrs)}h played
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                                    {timeAgo(entry.updatedAt)}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-card p-8 text-center">
                                    <p className="text-muted-foreground">No activity yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Game library grid */}
                        {library.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-display font-semibold flex items-center gap-2 text-lg">
                                    <LayoutGrid className="h-5 w-5 text-neon-cyan" />
                                    Game Library
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {library.slice(0, 20).map((entry) => (
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
