"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { GameCard } from "@/components/GameCard";
import { TrackerStats } from "@/components/TrackerStats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GameStatus } from "@/lib/utils";
import { PLATFORM_LABELS } from "@/lib/tracker";
import {
    Gamepad2,
    Trophy,
    XCircle,
    Clock,
    LayoutGrid,
    Download,
    Upload,
    User,
    CalendarDays,
    Timer,
    Star,
    TrendingUp,
    Activity,
    Heart,
    List,
    Grid3X3,
    Pencil,
    Check,
    X,
    Loader2,
    Camera,
    Users,
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

interface UserProfile {
    name: string;
    email: string;
    joinedAt: string;
    image: string | null;
    bio: string;
    trackerPlatform: string | null;
    trackerUsername: string | null;
}

interface FriendInfo {
    id: string;
    name: string | null;
    image: string | null;
}

interface ProfileClientProps {
    user: UserProfile;
    library: LibraryEntry[];
    friends?: FriendInfo[];
}

const statusFilters = [
    { value: "ALL", label: "All Games", icon: LayoutGrid },
    { value: "PLAYING", label: "Playing", icon: Gamepad2 },
    { value: "COMPLETED", label: "Completed", icon: Trophy },
    { value: "BACKLOG", label: "Backlog", icon: Clock },
    { value: "DROPPED", label: "Dropped", icon: XCircle },
];

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
        default: return "Updated";
    }
}

function statusColor(status: string): string {
    switch (status) {
        case "PLAYING": return "text-green-400";
        case "COMPLETED": return "text-neon-cyan";
        case "DROPPED": return "text-red-400";
        case "BACKLOG": return "text-yellow-400";
        default: return "text-muted-foreground";
    }
}

export function ProfileClient({ user, library, friends = [] }: ProfileClientProps) {
    const [activeTab, setActiveTab] = useState("overview");
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [importing, setImporting] = useState(false);
    const [displayMode, setDisplayMode] = useState<"grid" | "list">("grid");
    const [favorites, setFavorites] = useState<LibraryEntry[]>(
        library.filter((e) => e.favorite)
    );

    // Avatar upload state
    const [avatarUrl, setAvatarUrl] = useState(user.image || "");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be under 2 MB.");
            return;
        }

        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);
            const res = await fetch("/api/profile/avatar", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setAvatarUrl(data.image);
            } else {
                const err = await res.json();
                alert(err.error || "Upload failed.");
            }
        } catch {
            alert("Upload failed.");
        } finally {
            setUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = "";
        }
    };

    // About Me editing state
    const [bio, setBio] = useState(user.bio || "");
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioInput, setBioInput] = useState(user.bio || "");
    const [savingBio, setSavingBio] = useState(false);
    const bioTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditingBio && bioTextareaRef.current) {
            bioTextareaRef.current.focus();
            bioTextareaRef.current.setSelectionRange(
                bioTextareaRef.current.value.length,
                bioTextareaRef.current.value.length
            );
        }
    }, [isEditingBio]);

    const handleSaveBio = async () => {
        setSavingBio(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bio: bioInput }),
            });
            if (res.ok) {
                const data = await res.json();
                setBio(data.bio || "");
                setIsEditingBio(false);
            } else {
                alert("Failed to save bio.");
            }
        } catch {
            alert("Failed to save bio.");
        } finally {
            setSavingBio(false);
        }
    };

    const handleCancelBio = () => {
        setBioInput(bio);
        setIsEditingBio(false);
    };

    // Stats
    const statusCounts = {
        ALL: library.length,
        PLAYING: library.filter((e) => e.status === "PLAYING").length,
        COMPLETED: library.filter((e) => e.status === "COMPLETED").length,
        DROPPED: library.filter((e) => e.status === "DROPPED").length,
        BACKLOG: library.filter((e) => e.status === "BACKLOG").length,
    };

    const totalPlaytime = library.reduce((sum, e) => sum + e.playtimeHrs, 0);
    const ratedGames = library.filter((e) => e.userRating !== null);
    const meanScore = ratedGames.length > 0
        ? ratedGames.reduce((sum, e) => sum + (e.userRating ?? 0), 0) / ratedGames.length
        : 0;

    // Activity: recent library updates
    const recentActivity = [...library]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8);

    // Filtered library for Game List tab
    const filteredLibrary = activeFilter === "ALL"
        ? library
        : library.filter((e) => e.status === activeFilter);

    const joinDate = new Date(user.joinedAt);
    const memberSince = joinDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const handleSteamImport = async () => {
        const steamId = prompt("Enter your Steam ID (17-digit number):");
        if (!steamId) return;
        setImporting(true);
        try {
            const res = await fetch("/api/steam/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ steamId }),
            });
            if (res.ok) window.location.reload();
            else alert("Import failed. Check your Steam API key and Steam ID.");
        } catch {
            alert("Import failed.");
        } finally {
            setImporting(false);
        }
    };

    const handleEpicImport = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,.csv";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            setImporting(true);
            try {
                const text = await file.text();
                const res = await fetch("/api/epic/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ data: text, format: file.name.endsWith(".csv") ? "csv" : "json" }),
                });
                if (res.ok) window.location.reload();
                else alert("Import failed.");
            } catch {
                alert("Import failed.");
            } finally {
                setImporting(false);
            }
        };
        input.click();
    };

    // ── Tracker account linking state ──
    const [trackerPlatform, setTrackerPlatform] = useState(user.trackerPlatform || "");
    const [trackerUsername, setTrackerUsername] = useState(user.trackerUsername || "");
    const [trackerPlatformInput, setTrackerPlatformInput] = useState(user.trackerPlatform || "origin");
    const [trackerUsernameInput, setTrackerUsernameInput] = useState(user.trackerUsername || "");
    const [savingTracker, setSavingTracker] = useState(false);
    const [trackerMessage, setTrackerMessage] = useState<string | null>(null);

    const handleSaveTracker = async () => {
        if (!trackerUsernameInput.trim()) return;
        setSavingTracker(true);
        setTrackerMessage(null);
        try {
            const res = await fetch("/api/profile/tracker", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ platform: trackerPlatformInput, username: trackerUsernameInput.trim() }),
            });
            if (res.ok) {
                const data = await res.json();
                setTrackerPlatform(data.trackerPlatform || "");
                setTrackerUsername(data.trackerUsername || "");
                setTrackerMessage("Account linked!");
            } else {
                const err = await res.json();
                setTrackerMessage(err.error || "Failed to save.");
            }
        } catch {
            setTrackerMessage("Failed to save.");
        } finally {
            setSavingTracker(false);
        }
    };

    const handleUnlinkTracker = async () => {
        setSavingTracker(true);
        setTrackerMessage(null);
        try {
            const res = await fetch("/api/profile/tracker", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                setTrackerPlatform("");
                setTrackerUsername("");
                setTrackerPlatformInput("origin");
                setTrackerUsernameInput("");
                setTrackerMessage("Account unlinked.");
            }
        } catch {
            setTrackerMessage("Failed to unlink.");
        } finally {
            setSavingTracker(false);
        }
    };

    const tabs = [
        { value: "overview", label: "Overview" },
        { value: "game-list", label: "Game List" },
        { value: "stats", label: "Stats" },
        { value: "tracker", label: "Tracker Stats" },
    ];

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

                {/* User info overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 lg:px-20 pb-4 flex items-end gap-5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0 group">
                        <div
                            className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl border-4 border-background/80 bg-gradient-to-br from-neon-cyan/30 to-neon-orange/20 flex items-center justify-center shadow-xl overflow-hidden cursor-pointer"
                            onClick={() => avatarInputRef.current?.click()}
                        >
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl sm:text-5xl font-display font-bold text-neon-cyan/80">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                            {/* Upload overlay */}
                            <div className={`absolute inset-0 flex items-center justify-center rounded-xl transition-all duration-200 ${uploadingAvatar
                                ? "bg-black/60"
                                : "bg-black/0 group-hover:bg-black/50"
                                }`}>
                                {uploadingAvatar ? (
                                    <Loader2 className="h-7 w-7 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-7 w-7 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg" />
                                )}
                            </div>
                        </div>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-3 border-background" />
                    </div>

                    {/* Name & meta */}
                    <div className="pb-1 min-w-0">
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
                </div>
            </div>

            {/* ═══════ TAB BAR ═══════ */}
            <div className="border-b border-border/50 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-10 px-0" style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
                <div className="flex items-center justify-center gap-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${activeTab === tab.value
                                ? "border-neon-cyan text-neon-cyan"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════ CONTENT ═══════ */}
            <div className="pt-8">
                {activeTab === "overview" && (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* LEFT: About Me */}
                        <div className="space-y-6">
                            {/* About card */}
                            <div className="glass-card p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display font-semibold flex items-center gap-2">
                                        <User className="h-5 w-5 text-neon-cyan" />
                                        About Me
                                    </h3>
                                    {!isEditingBio && (
                                        <button
                                            onClick={() => { setBioInput(bio); setIsEditingBio(true); }}
                                            className="p-1.5 rounded-md text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all duration-200"
                                            title="Edit bio"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3 text-sm text-muted-foreground">
                                    {isEditingBio ? (
                                        <div className="space-y-2">
                                            <textarea
                                                ref={bioTextareaRef}
                                                value={bioInput}
                                                onChange={(e) => setBioInput(e.target.value.slice(0, 500))}
                                                placeholder="Tell others about yourself and your gaming journey..."
                                                className="w-full min-h-[80px] max-h-[200px] p-3 rounded-lg bg-muted/30 border border-border/50 focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 outline-none text-sm text-foreground placeholder:text-muted-foreground/50 resize-y transition-all duration-200"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Escape") handleCancelBio();
                                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveBio();
                                                }}
                                            />
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[10px] ${bioInput.length >= 480 ? "text-red-400" : "text-muted-foreground/50"}`}>
                                                    {bioInput.length}/500
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={handleCancelBio}
                                                        disabled={savingBio}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200 disabled:opacity-50"
                                                    >
                                                        <X className="h-3 w-3" />
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveBio}
                                                        disabled={savingBio}
                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 transition-all duration-200 disabled:opacity-50"
                                                    >
                                                        {savingBio ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Check className="h-3 w-3" />
                                                        )}
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{bio || "Welcome to my gaming profile! 🎮"}</p>
                                    )}
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

                            {/* Import section */}
                            <div className="glass-card p-5 space-y-3">
                                <h3 className="font-display font-semibold flex items-center gap-2">
                                    <Download className="h-5 w-5 text-neon-cyan" />
                                    Import Library
                                </h3>
                                <div className="space-y-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSteamImport}
                                        disabled={importing}
                                        className="w-full gap-2 justify-start"
                                    >
                                        <Download className="w-4 h-4" />
                                        Import from Steam
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleEpicImport}
                                        disabled={importing}
                                        className="w-full gap-2 justify-start"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Import from Epic
                                    </Button>
                                </div>
                            </div>

                            {/* Connected Accounts (Tracker.gg) */}
                            <div className="glass-card p-5 space-y-3">
                                <h3 className="font-display font-semibold flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-neon-cyan" />
                                    Connected Accounts
                                </h3>
                                {trackerUsername ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs font-medium text-green-400">Tracker.gg Linked</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <p><span className="text-foreground font-medium">{trackerUsername}</span></p>
                                            <p className="text-xs">{PLATFORM_LABELS[trackerPlatform] || trackerPlatform}</p>
                                        </div>
                                        <button
                                            onClick={handleUnlinkTracker}
                                            disabled={savingTracker}
                                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            {savingTracker ? "Unlinking..." : "Unlink Account"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <select
                                            value={trackerPlatformInput}
                                            onChange={(e) => setTrackerPlatformInput(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 outline-none transition-all"
                                        >
                                            <option value="origin">EA / Origin</option>
                                            <option value="xbl">Xbox Live</option>
                                            <option value="psn">PlayStation</option>
                                            <option value="uplay">Ubisoft Connect</option>
                                        </select>
                                        <input
                                            type="text"
                                            value={trackerUsernameInput}
                                            onChange={(e) => setTrackerUsernameInput(e.target.value)}
                                            placeholder="Enter your gamertag..."
                                            className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 outline-none transition-all"
                                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveTracker(); }}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSaveTracker}
                                            disabled={savingTracker || !trackerUsernameInput.trim()}
                                            className="w-full gap-2"
                                        >
                                            {savingTracker ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <TrendingUp className="h-3.5 w-3.5" />
                                            )}
                                            Link Tracker.gg
                                        </Button>
                                    </div>
                                )}
                                {trackerMessage && (
                                    <p className={`text-xs ${trackerMessage.includes("Failed") ? "text-red-400" : "text-green-400"}`}>
                                        {trackerMessage}
                                    </p>
                                )}
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
                                        No favorites yet! Open a game and click the ❤️ Favorite button.
                                    </p>
                                )}
                            </div>

                            {/* Friends */}
                            <div className="glass-card p-5 space-y-3">
                                <Link href="/users">
                                    <h3 className="font-display font-semibold flex items-center gap-2 hover:text-blue-400 transition-colors">
                                        <Users className="h-5 w-5 text-blue-400" />
                                        Friends
                                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-auto">
                                            {friends.length}
                                        </span>
                                    </h3>
                                </Link>
                                {friends.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {friends.slice(0, 6).map((friend) => (
                                            <Link key={friend.id} href={`/users/${friend.id}`}>
                                                <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-muted/30 transition-all cursor-pointer group">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/20 flex items-center justify-center overflow-hidden border-2 border-border/50 group-hover:border-blue-500/30 transition-colors">
                                                        {friend.image ? (
                                                            <img src={friend.image} alt={friend.name || "Friend"} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-display font-bold text-blue-400/80">
                                                                {(friend.name || "?").charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground truncate max-w-full group-hover:text-foreground transition-colors">
                                                        {friend.name || "Gamer"}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No friends yet. <Link href="/users" className="text-blue-400 hover:underline">Find gamers</Link> to connect with!
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Stats + Activity */}
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
                                                    {/* Game cover */}
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

                                                    {/* Activity info */}
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

                                                    {/* Timestamp */}
                                                    <div className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                                                        {timeAgo(entry.updatedAt)}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass-card p-8 text-center">
                                        <p className="text-muted-foreground">No activity yet. Start adding games to your library!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "game-list" && (
                    <div className="space-y-6">
                        {/* Filter pills + Display toggle */}
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex flex-wrap gap-2">
                                {statusFilters.map((filter) => {
                                    const count = statusCounts[filter.value as keyof typeof statusCounts];
                                    return (
                                        <button
                                            key={filter.value}
                                            onClick={() => setActiveFilter(filter.value)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${activeFilter === filter.value
                                                ? "bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan"
                                                : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground/50"
                                                }`}
                                        >
                                            <filter.icon className="h-3.5 w-3.5" />
                                            {filter.label}
                                            <Badge variant="outline" className="ml-1 text-[10px] h-5 px-1.5">
                                                {count}
                                            </Badge>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Display mode toggle */}
                            <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
                                <button
                                    onClick={() => setDisplayMode("grid")}
                                    className={`p-2 rounded-md transition-all ${displayMode === "grid"
                                        ? "bg-neon-cyan/20 text-neon-cyan"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    title="Grid view"
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setDisplayMode("list")}
                                    className={`p-2 rounded-md transition-all ${displayMode === "list"
                                        ? "bg-neon-cyan/20 text-neon-cyan"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                    title="List view"
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Game display */}
                        {filteredLibrary.length > 0 ? (
                            displayMode === "grid" ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {filteredLibrary.map((entry) => (
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
                            ) : (
                                /* List view */
                                <div className="space-y-2">
                                    {/* List header */}
                                    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                        <span className="w-12">#</span>
                                        <span>Title</span>
                                        <span className="w-24 text-center">Status</span>
                                        <span className="w-20 text-center">Playtime</span>
                                        <span className="w-10 text-center">
                                            <Heart className="h-3 w-3 mx-auto" />
                                        </span>
                                    </div>
                                    {filteredLibrary.map((entry, index) => (
                                        <Link key={entry.id} href={`/game/${entry.game.id}`}>
                                            <div className="glass-card grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center px-4 py-3 hover:border-neon-cyan/30 transition-all duration-200 cursor-pointer group">
                                                {/* Cover thumbnail */}
                                                <div className="w-12 h-16 rounded-md overflow-hidden bg-muted/50 flex-shrink-0">
                                                    {entry.game.coverUrl ? (
                                                        <img src={entry.game.coverUrl} alt={entry.game.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground/30">
                                                            {entry.game.title.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-neon-cyan transition-colors">
                                                        {entry.game.title}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {(() => { try { return JSON.parse(entry.game.genres).join(", "); } catch { return ""; } })()}
                                                    </p>
                                                </div>

                                                {/* Status */}
                                                <div className="w-24 text-center">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${entry.status === "PLAYING" ? "bg-green-500/20 text-green-400" :
                                                        entry.status === "COMPLETED" ? "bg-neon-cyan/20 text-neon-cyan" :
                                                            entry.status === "DROPPED" ? "bg-red-500/20 text-red-400" :
                                                                "bg-yellow-500/20 text-yellow-400"
                                                        }`}>
                                                        {entry.status.charAt(0) + entry.status.slice(1).toLowerCase()}
                                                    </span>
                                                </div>

                                                {/* Playtime */}
                                                <div className="w-20 text-center text-xs text-muted-foreground">
                                                    {entry.playtimeHrs > 0 ? `${Math.round(entry.playtimeHrs)}h` : "—"}
                                                </div>

                                                {/* Favorite */}
                                                <div className="w-10 text-center">
                                                    {entry.favorite && (
                                                        <Heart className="h-4 w-4 text-red-400 fill-red-400 mx-auto" />
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <span className="text-3xl">🎮</span>
                                </div>
                                <p className="text-muted-foreground text-lg">
                                    {activeFilter === "ALL" ? "Your library is empty" : `No ${activeFilter.toLowerCase()} games`}
                                </p>
                                <p className="text-muted-foreground/60 text-sm mt-1">
                                    {activeFilter === "ALL"
                                        ? "Discover games and add them to your library"
                                        : "Change your game status to see them here"
                                    }
                                </p>
                                {activeFilter === "ALL" && (
                                    <Link href="/discover">
                                        <Button className="mt-4 gap-2 bg-gradient-to-r from-neon-cyan to-neon-cyan/80 text-background font-semibold">
                                            <Gamepad2 className="h-4 w-4" />
                                            Discover Games
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "stats" && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Total Games */}
                        <div className="glass-card p-6 text-center">
                            <Gamepad2 className="h-8 w-8 text-neon-cyan mx-auto mb-3" />
                            <div className="text-4xl font-display font-bold text-foreground">{library.length}</div>
                            <div className="text-sm text-muted-foreground mt-1">Total Games</div>
                        </div>

                        {/* Total Playtime */}
                        <div className="glass-card p-6 text-center">
                            <Timer className="h-8 w-8 text-neon-cyan mx-auto mb-3" />
                            <div className="text-4xl font-display font-bold text-foreground">{Math.round(totalPlaytime)}</div>
                            <div className="text-sm text-muted-foreground mt-1">Hours Played</div>
                        </div>

                        {/* Mean Score */}
                        <div className="glass-card p-6 text-center">
                            <Star className="h-8 w-8 text-neon-orange mx-auto mb-3" />
                            <div className="text-4xl font-display font-bold text-foreground">
                                {meanScore > 0 ? meanScore.toFixed(1) : "—"}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">Mean Score</div>
                        </div>

                        {/* Completed */}
                        <div className="glass-card p-6 text-center">
                            <Trophy className="h-8 w-8 text-neon-cyan mx-auto mb-3" />
                            <div className="text-4xl font-display font-bold text-foreground">{statusCounts.COMPLETED}</div>
                            <div className="text-sm text-muted-foreground mt-1">Completed</div>
                        </div>

                        {/* Playing */}
                        <div className="glass-card p-6 text-center">
                            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-3" />
                            <div className="text-4xl font-display font-bold text-foreground">{statusCounts.PLAYING}</div>
                            <div className="text-sm text-muted-foreground mt-1">Currently Playing</div>
                        </div>

                        {/* Completion Rate */}
                        <div className="glass-card p-6 text-center">
                            <Activity className="h-8 w-8 text-neon-orange mx-auto mb-3" />
                            <div className="text-4xl font-display font-bold text-foreground">
                                {library.length > 0 ? Math.round((statusCounts.COMPLETED / library.length) * 100) : 0}%
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">Completion Rate</div>
                        </div>

                        {/* Status breakdown */}
                        <div className="glass-card p-6 sm:col-span-2 lg:col-span-3">
                            <h3 className="font-display font-semibold mb-4">Library Breakdown</h3>
                            <div className="space-y-3">
                                {[
                                    { label: "Playing", count: statusCounts.PLAYING, color: "bg-green-500" },
                                    { label: "Completed", count: statusCounts.COMPLETED, color: "bg-neon-cyan" },
                                    { label: "Backlog", count: statusCounts.BACKLOG, color: "bg-yellow-500" },
                                    { label: "Dropped", count: statusCounts.DROPPED, color: "bg-red-500" },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">{item.label}</span>
                                            <span className="font-medium">{item.count}</span>
                                        </div>
                                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.color} rounded-full transition-all duration-700`}
                                                style={{ width: `${(item.count / Math.max(library.length, 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "tracker" && (
                    <TrackerStats
                        platform={trackerPlatform || null}
                        username={trackerUsername || null}
                    />
                )}
            </div>
        </div>
    );
}
