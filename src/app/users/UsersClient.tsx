"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Users, Loader2, UserCheck, UserX, Clock } from "lucide-react";
import { UserCard } from "@/components/UserCard";
import { Button } from "@/components/ui/button";

interface UserResult {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    gameCount: number;
}

interface PendingRequest {
    friendshipId: string;
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    sentAt: string;
}

interface Friend {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    friendshipId: string;
}

export default function UsersClient() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<UserResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [respondingId, setRespondingId] = useState<string | null>(null);

    // Load friends & pending requests
    useEffect(() => {
        async function loadFriends() {
            try {
                const res = await fetch("/api/friends/list");
                if (res.ok) {
                    const data = await res.json();
                    setFriends(data.friends ?? []);
                    setPending(data.pending ?? []);
                }
            } catch {
                // silently fail
            } finally {
                setLoadingFriends(false);
            }
        }
        loadFriends();
    }, []);

    // Debounced search
    const searchUsers = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data.users ?? []);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (query.trim().length >= 2) {
                searchUsers(query);
            } else {
                setResults([]);
            }
        }, 400);
        return () => clearTimeout(timeout);
    }, [query, searchUsers]);

    const handleRespond = async (friendshipId: string, action: "ACCEPTED" | "REJECTED") => {
        setRespondingId(friendshipId);
        try {
            const res = await fetch("/api/friends/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendshipId, action }),
            });
            if (res.ok) {
                const req = pending.find((p) => p.friendshipId === friendshipId);
                setPending((prev) => prev.filter((p) => p.friendshipId !== friendshipId));
                if (action === "ACCEPTED" && req) {
                    setFriends((prev) => [
                        { id: req.id, name: req.name, image: req.image, bio: req.bio, friendshipId },
                        ...prev,
                    ]);
                }
            }
        } catch {
            // silently fail
        } finally {
            setRespondingId(null);
        }
    };

    // Build a set of friend IDs and pending IDs for quick lookup in search results
    const friendIds = new Set(friends.map((f) => f.id));
    const pendingIds = new Set(pending.map((p) => p.id));

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
                <div className="relative mx-auto max-w-4xl px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                        <span className="gradient-text">Connect</span>{" "}
                        <span className="text-foreground">with Gamers</span>
                    </h1>
                    <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                        Find other players, view their profiles, and build your gaming network.
                    </p>

                    {/* Search bar */}
                    <div className="relative max-w-2xl mx-auto">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for users by name..."
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-card/80 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm text-lg transition-all"
                                autoFocus
                            />
                            {loading && (
                                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400 animate-spin" />
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-4 pb-16 space-y-10">
                {/* Pending requests */}
                {!loadingFriends && pending.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                            <Clock className="h-5 w-5 text-yellow-400" />
                            Pending Friend Requests
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full ml-1">
                                {pending.length}
                            </span>
                        </h2>
                        <div className="grid gap-3">
                            {pending.map((req) => (
                                <div
                                    key={req.friendshipId}
                                    className="glass-card p-4 flex items-center gap-4"
                                >
                                    <Link href={`/users/${req.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-border/50">
                                            {req.image ? (
                                                <img src={req.image} alt={req.name || "User"} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-display font-bold text-yellow-400/80">
                                                    {(req.name || "?").charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {req.name || "Gamer"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Sent you a friend request
                                            </p>
                                        </div>
                                    </Link>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                            size="sm"
                                            onClick={() => handleRespond(req.friendshipId, "ACCEPTED")}
                                            disabled={respondingId === req.friendshipId}
                                            className="gap-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/20"
                                        >
                                            <UserCheck className="h-3.5 w-3.5" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRespond(req.friendshipId, "REJECTED")}
                                            disabled={respondingId === req.friendshipId}
                                            className="gap-1.5 text-red-400 border-red-500/20 hover:bg-red-500/10"
                                        >
                                            <UserX className="h-3.5 w-3.5" />
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search results */}
                {query.length >= 2 && (
                    <div className="space-y-4">
                        {results.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="text-blue-400 font-semibold">{results.length}</span> results for &quot;{query}&quot;
                            </p>
                        )}
                        <div className="grid gap-3">
                            {results.map((user) => (
                                <UserCard
                                    key={user.id}
                                    id={user.id}
                                    name={user.name}
                                    image={user.image}
                                    bio={user.bio}
                                    gameCount={user.gameCount}
                                    friendshipStatus={
                                        friendIds.has(user.id)
                                            ? "ACCEPTED"
                                            : pendingIds.has(user.id)
                                                ? "PENDING"
                                                : null
                                    }
                                />
                            ))}
                        </div>
                    </div>
                )}

                {query.length >= 2 && !loading && results.length === 0 && (
                    <div className="text-center py-16">
                        <Users className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                        <p className="text-muted-foreground text-lg">No users found</p>
                        <p className="text-muted-foreground/60 text-sm mt-1">
                            Try a different search term
                        </p>
                    </div>
                )}

                {query.length < 2 && !loading && (
                    <>
                        {/* Friends list */}
                        {!loadingFriends && friends.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-blue-400" />
                                    Your Friends
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full ml-1">
                                        {friends.length}
                                    </span>
                                </h2>
                                <div className="grid gap-3">
                                    {friends.map((friend) => (
                                        <UserCard
                                            key={friend.id}
                                            id={friend.id}
                                            name={friend.name}
                                            image={friend.image}
                                            bio={friend.bio}
                                            gameCount={0}
                                            friendshipStatus="ACCEPTED"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {!loadingFriends && friends.length === 0 && pending.length === 0 && (
                            <div className="text-center py-16">
                                <Search className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
                                <p className="text-muted-foreground">
                                    Search for users above to connect with other gamers
                                </p>
                            </div>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
