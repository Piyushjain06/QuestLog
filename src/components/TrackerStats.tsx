"use client";

import { useState, useEffect } from "react";
import {
    Loader2,
    AlertCircle,
    Crosshair,
    Skull,
    Flame,
    Trophy,
    Target,
    Shield,
    TrendingUp,
    ExternalLink,
} from "lucide-react";
import type { TrackerSegment, TrackerStat } from "@/lib/tracker";
import { PLATFORM_LABELS } from "@/lib/tracker";

interface TrackerStatsProps {
    platform: string | null;
    username: string | null;
    game?: string;
}

interface ProfileData {
    platformInfo: {
        platformSlug: string;
        platformUserHandle: string;
        avatarUrl: string | null;
    };
    segments: TrackerSegment[];
}

const STAT_ICONS: Record<string, React.ReactNode> = {
    level: <TrendingUp className="h-4 w-4" />,
    kills: <Crosshair className="h-4 w-4" />,
    damage: <Flame className="h-4 w-4" />,
    wins: <Trophy className="h-4 w-4" />,
    headshots: <Target className="h-4 w-4" />,
    revives: <Shield className="h-4 w-4" />,
    deaths: <Skull className="h-4 w-4" />,
};

const STAT_COLORS: Record<string, string> = {
    level: "text-neon-cyan",
    kills: "text-red-400",
    damage: "text-neon-orange",
    wins: "text-yellow-400",
    headshots: "text-neon-purple",
    revives: "text-green-400",
    deaths: "text-muted-foreground",
};

function SkeletonCard() {
    return (
        <div className="glass-card p-5 animate-pulse space-y-4">
            <div className="h-5 w-32 bg-muted/40 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="h-3 w-16 bg-muted/30 rounded" />
                        <div className="h-8 w-20 bg-muted/40 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatItem({ stat, name }: { stat: TrackerStat; name: string }) {
    const key = name.toLowerCase().replace(/\s+/g, "");
    const icon = STAT_ICONS[key] || <TrendingUp className="h-4 w-4" />;
    const color = STAT_COLORS[key] || "text-neon-cyan";

    return (
        <div className="glass-card p-4 text-center group hover:border-neon-cyan/30 transition-all duration-200">
            <div className={`flex items-center justify-center gap-1.5 mb-2 ${color}`}>
                {icon}
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.displayName}
                </span>
            </div>
            <div className={`text-2xl font-display font-bold ${color}`}>
                {stat.displayValue}
            </div>
            {stat.rank !== null && stat.rank > 0 && (
                <div className="text-[10px] text-muted-foreground/60 mt-1">
                    Rank #{stat.rank.toLocaleString()}
                </div>
            )}
            {stat.percentile !== null && stat.percentile > 0 && (
                <div className="mt-1.5">
                    <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
                            style={{ width: `${stat.percentile}%` }}
                        />
                    </div>
                    <span className="text-[9px] text-muted-foreground/50">
                        Top {(100 - stat.percentile).toFixed(0)}%
                    </span>
                </div>
            )}
        </div>
    );
}

function LegendCard({ segment }: { segment: TrackerSegment }) {
    const name = segment.metadata.name || "Unknown";
    const imageUrl = segment.metadata.imageUrl || segment.metadata.tallImageUrl;
    const kills = segment.stats.kills;
    const damage = segment.stats.damage;
    const wins = segment.stats.wins;

    return (
        <div className="glass-card p-3 flex items-center gap-3 hover:border-neon-cyan/30 transition-all duration-200 group">
            {imageUrl && (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-neon-cyan transition-colors">
                    {name}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    {kills && (
                        <span className="flex items-center gap-1">
                            <Crosshair className="h-3 w-3 text-red-400" />
                            {kills.displayValue}
                        </span>
                    )}
                    {damage && (
                        <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-neon-orange" />
                            {damage.displayValue}
                        </span>
                    )}
                    {wins && (
                        <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-yellow-400" />
                            {wins.displayValue}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function TrackerStats({ platform, username, game = "apex" }: TrackerStatsProps) {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!platform || !username) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch(`/api/tracker/${game}/${platform}/${encodeURIComponent(username)}`)
            .then(async (res) => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || `Failed to load stats (${res.status})`);
                }
                return res.json();
            })
            .then((data) => {
                if (!cancelled) setProfile(data);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [platform, username, game]);

    // ── Not linked state ──
    if (!platform || !username) {
        return (
            <div className="glass-card p-10 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                    <Target className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-display font-semibold text-lg">No Account Linked</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Link your gamertag in the <strong>Overview</strong> tab under
                    &quot;Connected Accounts&quot; to see your live stats here.
                </p>
            </div>
        );
    }

    // ── Loading state ──
    if (loading) {
        return (
            <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    // ── Error state ──
    if (error) {
        return (
            <div className="glass-card p-8 text-center space-y-3 border-red-500/20">
                <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
                <h3 className="font-display font-semibold text-lg text-red-400">Failed to Load Stats</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
                <button
                    onClick={() => {
                        setError(null);
                        setLoading(true);
                        fetch(`/api/tracker/${game}/${platform}/${encodeURIComponent(username)}`)
                            .then(async (res) => {
                                if (!res.ok) {
                                    const err = await res.json().catch(() => ({}));
                                    throw new Error(err.error || `Failed (${res.status})`);
                                }
                                return res.json();
                            })
                            .then(setProfile)
                            .catch((e) => setError(e.message))
                            .finally(() => setLoading(false));
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!profile) return null;

    // ── Parse segments ──
    const overviewSegment = profile.segments.find((s) => s.type === "overview");
    const legendSegments = profile.segments.filter((s) => s.type === "legend");

    // Important overview stats to display prominently
    const overviewStats = overviewSegment?.stats
        ? Object.entries(overviewSegment.stats)
        : [];

    // Prioritise key stats
    const priorityKeys = ["level", "kills", "damage", "wins", "headshots", "revives"];
    const sortedStats = [
        ...overviewStats.filter(([key]) => priorityKeys.includes(key)),
        ...overviewStats.filter(([key]) => !priorityKeys.includes(key)),
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="glass-card p-5 flex items-center gap-4">
                {profile.platformInfo.avatarUrl && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted/30 flex-shrink-0 ring-2 ring-neon-cyan/20">
                        <img
                            src={profile.platformInfo.avatarUrl}
                            alt={profile.platformInfo.platformUserHandle}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-display font-bold text-foreground truncate">
                        {profile.platformInfo.platformUserHandle}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-cyan/10 text-neon-cyan text-[10px] font-medium">
                            {PLATFORM_LABELS[profile.platformInfo.platformSlug] || profile.platformInfo.platformSlug}
                        </span>
                        <span>•</span>
                        <span>Apex Legends</span>
                    </p>
                </div>
                <a
                    href={`https://tracker.gg/apex/profile/${platform}/${encodeURIComponent(username)}/overview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all"
                    title="View on Tracker.gg"
                >
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>

            {/* Career Stats Grid */}
            {sortedStats.length > 0 && (
                <div>
                    <h3 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-neon-cyan" />
                        Career Stats
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {sortedStats.map(([key, stat]) => (
                            <StatItem key={key} stat={stat} name={key} />
                        ))}
                    </div>
                </div>
            )}

            {/* Legend Breakdown */}
            {legendSegments.length > 0 && (
                <div>
                    <h3 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-neon-purple" />
                        Legend Stats
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {legendSegments.map((segment, i) => (
                            <LegendCard key={i} segment={segment} />
                        ))}
                    </div>
                </div>
            )}

            {/* Attribution */}
            <p className="text-[10px] text-muted-foreground/40 text-center">
                Stats powered by{" "}
                <a
                    href="https://tracker.gg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-neon-cyan transition-colors underline"
                >
                    Tracker.gg
                </a>
                {" "}• Updated every 5 minutes
            </p>
        </div>
    );
}
