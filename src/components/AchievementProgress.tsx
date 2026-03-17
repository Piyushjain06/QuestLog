"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface AchievementProgressProps {
    gameId: string;
    steamAppId?: string | null;
    totalAchievements: number;
    unlockedAchievements: number;
}

export function AchievementProgress({ gameId, steamAppId, totalAchievements, unlockedAchievements }: AchievementProgressProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState<string | null>(null);
    const router = useRouter();

    const percent = totalAchievements === 0 ? 0 : Math.round((unlockedAchievements / totalAchievements) * 100);

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncError(null);
        try {
            const res = await fetch(`/api/games/${gameId}/sync-achievements`, { method: "POST" });
            const data = await res.json();
            
            if (!res.ok) {
                setSyncError(data.error || "Failed to sync achievements");
                return;
            }
            
            router.refresh(); // Tells Next.js to refetch the Server Component
        } catch (e) {
            console.error("Failed to sync achievements", e);
            setSyncError("Network error while syncing");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 border border-border/40 hover:border-violet-500/30 transition-colors">
            <div className="flex-1 w-full space-y-2.5">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        {totalAchievements > 0 ? (
                            <>{unlockedAchievements} / {totalAchievements} Achievements Earned</>
                        ) : (
                            <>No achievements synced yet</>
                        )}
                    </span>
                    {totalAchievements > 0 && (
                        <span className="text-sm font-bold text-violet-400">{percent}%</span>
                    )}
                </div>
                
                {/* Custom sleek progress bar */}
                <div className="h-2 w-full bg-muted overflow-hidden rounded-full border border-black/20 shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-violet-600 to-indigo-400 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            {/* Sync control block */}
            <div className="flex flex-col items-end shrink-0 w-full sm:w-auto gap-2">
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-semibold hover:bg-violet-500/20 hover:border-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <RefreshCw className={`w-4 h-4 transition-transform ${isSyncing ? "animate-spin" : "group-hover:rotate-180 duration-500"}`} />
                    {isSyncing ? "Syncing..." : "Sync with Steam"}
                </button>
                {syncError && (
                    <span className="text-xs text-red-400 font-medium px-1 max-w-[200px] text-right">
                        {syncError}
                    </span>
                )}
            </div>
        </div>
    );
}
