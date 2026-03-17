"use client";

import { useState, useEffect } from "react";
import { Loader2, Link2, Unlink, Download, CheckCircle2, X, AlertTriangle, ExternalLink, Gamepad2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

interface SteamProfile {
    steamId: string;
    username: string;
    avatarUrl?: string;
}

interface SteamLinkCardProps {
    steamProfile?: SteamProfile | null;
}

const LOADING_MESSAGES = [
    "Connecting to Steam servers...",
    "Fetching your game library...",
    "Looking up IGDB cover art...",
    "Syncing achievement data...",
    "Matching games to database...",
    "Caching achievement schemas...",
    "Importing playtime records...",
    "Finalizing your library...",
    "Almost there, hang tight...",
];

function ImportLoadingOverlay({ username }: { username: string }) {
    const [msgIndex, setMsgIndex] = useState(0);
    const [progress, setProgress] = useState(5);

    useEffect(() => {
        // Cycle through messages every 3 seconds
        const msgInterval = setInterval(() => {
            setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        }, 3000);

        // Slowly fill progress bar to 90% over ~45 seconds (simulate)
        const progressInterval = setInterval(() => {
            setProgress((p) => {
                if (p >= 90) return 90;
                return p + Math.random() * 2.5;
            });
        }, 1200);

        return () => {
            clearInterval(msgInterval);
            clearInterval(progressInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            {/* Animated background glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <div className="relative flex flex-col items-center gap-8 max-w-sm w-full mx-4 text-center">
                {/* Steam icon with spinner ring */}
                <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-[#171a21] border border-white/10 flex items-center justify-center shadow-2xl shadow-violet-500/20">
                        <svg viewBox="0 0 24 24" fill="white" className="w-12 h-12">
                            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .127.003.19.008l2.861-4.142V8.91a4.528 4.528 0 0 1 4.524-4.524c2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396a3.406 3.406 0 0 1-3.362-2.898L.309 15.044C1.59 20.152 6.293 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0z" />
                        </svg>
                    </div>
                    {/* Rotating ring */}
                    <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] animate-spin" style={{ animationDuration: "3s" }} viewBox="0 0 104 104">
                        <circle cx="52" cy="52" r="48" fill="none" stroke="url(#grad)" strokeWidth="3" strokeDasharray="80 220" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#7c3aed" />
                                <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Title */}
                <div className="space-y-1">
                    <h2 className="text-2xl font-display font-bold text-white">
                        Importing Library
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Syncing <span className="text-violet-400 font-medium">{username}&apos;s</span> Steam collection
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-full space-y-2">
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {/* Cycling message */}
                    <p className="text-xs text-muted-foreground h-4 transition-all duration-500">
                        {LOADING_MESSAGES[msgIndex]}
                    </p>
                </div>

                {/* Info cards */}
                <div className="w-full grid grid-cols-3 gap-3">
                    {[
                        { icon: <Gamepad2 className="w-4 h-4" />, label: "Games" },
                        { icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .127.003.19.008l2.861-4.142V8.91a4.528 4.528 0 0 1 4.524-4.524c2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396a3.406 3.406 0 0 1-3.362-2.898L.309 15.044C1.59 20.152 6.293 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0z"/></svg>, label: "Cover Art" },
                        { icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>, label: "Achievements" },
                    ].map(({ icon, label }) => (
                        <div key={label} className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-violet-400">{icon}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                            <Loader2 className="w-3 h-3 text-muted-foreground/50 animate-spin" />
                        </div>
                    ))}
                </div>

                <p className="text-xs text-muted-foreground/60 max-w-xs">
                    This may take up to a minute for large libraries. Please don&apos;t close this tab.
</p>
            </div>
        </div>
    );
}

export function SteamLinkCard({ steamProfile }: SteamLinkCardProps) {
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [unlinkError, setUnlinkError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ imported: number; achievementsSynced: number } | null>(null);
    const [importError, setImportError] = useState<string | null>(null);
    const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);

    const searchParams = useSearchParams();

    useEffect(() => {
        if (steamProfile && searchParams.get("steam") === "linked") {
            (async () => {
                setIsImporting(true);
                try {
                    const res = await fetch("/api/steam/import-library", { method: "POST" });
                    const data = await res.json();
                    if (!res.ok) {
                        const isPrivacyError = data.error?.toLowerCase().includes("private") ||
                            data.error?.toLowerCase().includes("no games found");
                        if (isPrivacyError) {
                            setShowPrivacyWarning(true);
                        } else {
                            setImportError(data.error || "Import failed");
                        }
                    } else {
                        setImportResult({ imported: data.imported, achievementsSynced: data.achievementsSynced });
                    }
                } catch {
                    // Silently ignore
                } finally {
                    setIsImporting(false);
                    window.history.replaceState({}, "", "/profile");
                }
            })();
        }
    }, [steamProfile, searchParams]);

    const handleUnlink = async () => {
        setIsUnlinking(true);
        setUnlinkError(null);
        try {
            const res = await fetch("/api/auth/steam/unlink", { method: "POST" });
            if (res.ok) {
                window.location.reload();
            } else {
                const data = await res.json();
                setUnlinkError(data.error || "Failed to unlink");
            }
        } catch (e) {
            console.error(e);
            setUnlinkError("Network error");
        } finally {
            setIsUnlinking(false);
        }
    };

    const handleImportLibrary = async () => {
        setIsImporting(true);
        setImportResult(null);
        setImportError(null);
        try {
            const res = await fetch("/api/steam/import-library", { method: "POST" });
            const data = await res.json();
            if (!res.ok) {
                const isPrivacyError = data.error?.toLowerCase().includes("private") ||
                    data.error?.toLowerCase().includes("no games found");
                if (isPrivacyError) {
                    setShowPrivacyWarning(true);
                } else {
                    setImportError(data.error || "Failed to import library");
                }
            } else {
                setImportResult({ imported: data.imported, achievementsSynced: data.achievementsSynced });
            }
        } catch (e) {
            console.error(e);
            setImportError("Network error while importing");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <>
            {/* Fullscreen loading overlay during import */}
            {isImporting && steamProfile && (
                <ImportLoadingOverlay username={steamProfile.username} />
            )}

            {/* Privacy Warning Modal */}
            {showPrivacyWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowPrivacyWarning(false)}>
                    <div
                        className="relative bg-[#0f0f13] border border-amber-500/30 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={() => setShowPrivacyWarning(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-display font-bold text-foreground">Steam Profile is Private</h3>
                                <p className="text-sm text-muted-foreground">We couldn&apos;t import your game library</p>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Your Steam account is linked, but your <strong className="text-foreground">game details are set to Private</strong>. QuestLog needs access to your library to import games and sync achievements.
                        </p>
                        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-2">
                            <p className="text-sm font-semibold text-amber-400">How to fix it:</p>
                            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                <li>Open Steam and go to your <strong className="text-foreground">Profile</strong></li>
                                <li>Click <strong className="text-foreground">Edit Profile → Privacy Settings</strong></li>
                                <li>Set <strong className="text-foreground">Game Details</strong> to <strong className="text-amber-400">Public</strong></li>
                                <li>Come back and click <strong className="text-foreground">Import Steam Library</strong></li>
                            </ol>
                        </div>
                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowPrivacyWarning(false)}>
                                I&apos;ll do it later
                            </Button>
                            <Button
                                className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                                onClick={() => { window.open("https://steamcommunity.com/my/edit/settings", "_blank"); setShowPrivacyWarning(false); }}
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open Steam Settings
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Card */}
            <div className="glass-card p-6 space-y-4 relative overflow-hidden group border border-border/50 hover:border-[#171a21]/50 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-[#171a21]/5 to-transparent block pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-[#171a21] rounded-xl flex items-center justify-center shadow-lg border border-white/5 shrink-0">
                        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .127.003.19.008l2.861-4.142V8.91a4.528 4.528 0 0 1 4.524-4.524c2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396a3.406 3.406 0 0 1-3.362-2.898L.309 15.044C1.59 20.152 6.293 24 11.979 24c6.627 0 12-5.373 12-12S18.605 0 11.979 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-display font-semibold text-foreground">Steam Integration</h3>
                        {steamProfile ? (
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Connected to <span className="text-foreground font-medium">{steamProfile.username}</span>
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Link your Steam account to automatically sync your game library and achievements.
                            </p>
                        )}
                    </div>
                </div>

                <div className="pt-2 relative z-10 flex flex-col gap-3 border-t border-border/40">
                    {steamProfile ? (
                        <>
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    {steamProfile.avatarUrl ? (
                                        <Image src={steamProfile.avatarUrl} alt={steamProfile.username} width={40} height={40} className="rounded-lg border border-border shadow-sm" />
                                    ) : (
                                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                            <span className="text-muted-foreground/50 font-display font-bold">{steamProfile.username.charAt(0)}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{steamProfile.username}</span>
                                        <span className="text-xs text-violet-400/80 font-medium">Steam Verified</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Button variant="destructive" size="sm" className="gap-2 font-medium" onClick={handleUnlink} disabled={isUnlinking || isImporting}>
                                        {isUnlinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                        Unlink Account
                                    </Button>
                                    {unlinkError && <span className="text-xs text-red-400 font-medium">{unlinkError}</span>}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-1">
                                {importResult ? (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        <span>Imported <strong>{importResult.imported}</strong> games &amp; synced achievements for <strong>{importResult.achievementsSynced}</strong> of them.</span>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-2 justify-center border-violet-500/20 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/40"
                                        onClick={handleImportLibrary}
                                        disabled={isImporting}
                                    >
                                        <Download className="w-4 h-4" />
                                        Import Steam Library &amp; Sync Achievements
                                    </Button>
                                )}
                                {importError && <span className="text-xs text-red-400 font-medium text-center">{importError}</span>}
                            </div>
                        </>
                    ) : (
                        <Button
                            onClick={() => window.location.href = '/api/auth/steam/login'}
                            className="w-full sm:w-auto mt-3 bg-[#171a21] hover:bg-[#2a2d36] text-white border border-[#2a2d36] shadow-md gap-2 h-11 px-6 rounded-xl transition-all"
                        >
                            <Link2 className="w-4 h-4" />
                            Sign in through Steam
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}
