"use client";

import { useState } from "react";
import { Loader2, Link2, Unlink } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SteamProfile {
    steamId: string;
    username: string;
    avatarUrl?: string;
}

interface SteamLinkCardProps {
    steamProfile?: SteamProfile | null;
}

export function SteamLinkCard({ steamProfile }: SteamLinkCardProps) {
    const [isUnlinking, setIsUnlinking] = useState(false);
    const [unlinkError, setUnlinkError] = useState<string | null>(null);
    const router = useRouter();

    const handleUnlink = async () => {
        setIsUnlinking(true);
        setUnlinkError(null);
        try {
            const res = await fetch("/api/auth/steam/unlink", { method: "POST" });
            if (res.ok) {
                // Hard reload to force server session recount if router.refresh() is caching
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

    return (
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
                            Link your Steam account to automatically sync your achievements across supported games.
                        </p>
                    )}
                </div>
            </div>

            <div className="pt-2 relative z-10 flex flex-col sm:flex-row items-center gap-4 justify-between border-t border-border/40">
                {steamProfile ? (
                    <>
                        <div className="flex items-center gap-3 w-full sm:w-auto mt-3">
                            {steamProfile.avatarUrl ? (
                                <Image 
                                    src={steamProfile.avatarUrl} 
                                    alt={steamProfile.username} 
                                    width={40} height={40} 
                                    className="rounded-lg border border-border shadow-sm"
                                />
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
                        <div className="flex flex-col items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full sm:w-auto gap-2 font-medium"
                                onClick={handleUnlink}
                                disabled={isUnlinking}
                            >
                                {isUnlinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                                Unlink Account
                            </Button>
                            {unlinkError && (
                                <span className="text-xs text-red-400 font-medium">{unlinkError}</span>
                            )}
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
    );
}
