"use client";

import Link from "next/link";
import { UserPlus, Check, Loader2, Gamepad2 } from "lucide-react";
import { useState } from "react";

interface UserCardProps {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    gameCount: number;
    friendshipStatus?: string | null;
    onAddFriend?: (userId: string) => Promise<void>;
}

export function UserCard({
    id,
    name,
    image,
    bio,
    gameCount,
    friendshipStatus,
    onAddFriend,
}: UserCardProps) {
    const [status, setStatus] = useState(friendshipStatus ?? null);
    const [loading, setLoading] = useState(false);

    const handleAddFriend = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading || status) return;
        setLoading(true);
        try {
            if (onAddFriend) {
                await onAddFriend(id);
            } else {
                const res = await fetch("/api/friends/request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ receiverId: id }),
                });
                if (res.ok) {
                    setStatus("PENDING");
                }
            }
            setStatus("PENDING");
        } catch {
            // silently fail
        } finally {
            setLoading(false);
        }
    };

    const displayName = name || "Gamer";

    return (
        <Link href={`/users/${id}`}>
            <div className="glass-card p-5 flex items-center gap-4 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-border/50 group-hover:border-blue-500/30 transition-colors">
                    {image ? (
                        <img
                            src={image}
                            alt={displayName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-xl font-display font-bold text-blue-400/80">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-blue-400 transition-colors">
                        {displayName}
                    </h3>
                    {bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {bio}
                        </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <Gamepad2 className="h-3 w-3" />
                        <span>{gameCount} games</span>
                    </div>
                </div>

                {/* Action */}
                <div className="flex-shrink-0">
                    {status === "ACCEPTED" ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">
                            <Check className="h-3 w-3" />
                            Friends
                        </span>
                    ) : status === "PENDING" ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                            Pending
                        </span>
                    ) : (
                        <button
                            onClick={handleAddFriend}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 hover:border-blue-400/30 transition-all duration-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <UserPlus className="h-3 w-3" />
                            )}
                            Add Friend
                        </button>
                    )}
                </div>
            </div>
        </Link>
    );
}
