"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Search, Sparkles, User, Menu, X, LogIn, LogOut, ChevronDown, Trophy, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

import { ThemeToggle } from "./ThemeToggle";

// Discover dropdown options
const DISCOVER_OPTIONS = [
    {
        href: "/discover",
        label: "Discover",
        description: "Search & explore games",
        icon: Compass,
        color: "text-neon-cyan",
        bg: "bg-neon-cyan/10",
    },
    {
        href: "/top100",
        label: "Top 100 Games",
        description: "Highest-rated of all time",
        icon: Trophy,
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
    },
];

const OTHER_NAV_LINKS = [
    { href: "/profile", label: "Library" },
    { href: "/users", label: "Social" },
];

export function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [discoverOpen, setDiscoverOpen] = useState(false);
    const { data: session } = useSession();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isDiscoverActive = pathname === "/discover" || pathname === "/top100";

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDiscoverOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-2xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="relative">
                            <Gamepad2 className="h-7 w-7 text-blue-500 transition-all duration-300 group-hover:scale-110" />
                        </div>
                        <span className="text-lg font-display font-bold tracking-tight">
                            <span className="text-foreground">Quest</span>
                            <span className="text-blue-500">Log</span>
                        </span>
                    </Link>

                    {/* Desktop nav — centered */}
                    <div className="hidden md:flex items-center gap-1">
                        {/* Discover dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDiscoverOpen((v) => !v)}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg",
                                    isDiscoverActive
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Discover
                                <ChevronDown
                                    className={cn(
                                        "h-3.5 w-3.5 transition-transform duration-200",
                                        discoverOpen && "rotate-180"
                                    )}
                                />
                            </button>

                            {discoverOpen && (
                                <div className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-background/95 border border-border backdrop-blur-xl shadow-2xl shadow-black/20 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {DISCOVER_OPTIONS.map((opt) => {
                                        const Icon = opt.icon;
                                        const isActive = pathname === opt.href;
                                        return (
                                            <Link
                                                key={opt.href}
                                                href={opt.href}
                                                onClick={() => setDiscoverOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                                                    isActive
                                                        ? "bg-accent text-foreground"
                                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                                )}
                                            >
                                                <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0", opt.bg)}>
                                                    <Icon className={cn("h-4 w-4", opt.color)} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                                                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Other nav links */}
                        {OTHER_NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg",
                                        isActive
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle />
                        {session ? (
                            <>
                                <Link href="/profile" className="group">
                                    <button className="flex items-center gap-2.5 px-5 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-500/20 hover:border-blue-400/30 text-foreground transition-all duration-300 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/20">
                                        <User className="h-4 w-4 text-blue-500 group-hover:text-blue-400 transition-colors" />
                                        <span className="max-w-[120px] truncate">{session.user?.name || "Profile"}</span>
                                    </button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
                                    title="Sign Out"
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                >
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link href="/auth">
                                    <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        Log in
                                    </button>
                                </Link>
                                <Link href="/auth">
                                    <button className="px-5 py-2 text-sm font-semibold rounded-full bg-blue-500 hover:bg-blue-400 text-white transition-all duration-200 shadow-lg shadow-blue-500/25">
                                        Get Started
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-muted-foreground"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden py-4 space-y-1 animate-slide-up border-t border-border">
                        {/* Discover options */}
                        <p className="px-4 pt-1 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Discover</p>
                        {DISCOVER_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = pathname === opt.href;
                            return (
                                <Link
                                    key={opt.href}
                                    href={opt.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "text-foreground bg-accent"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    )}
                                >
                                    <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0", opt.bg)}>
                                        <Icon className={cn("h-3.5 w-3.5", opt.color)} />
                                    </div>
                                    <div>
                                        <p className="font-medium">{opt.label}</p>
                                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Other links */}
                        <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Navigation</p>
                        {OTHER_NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        "block px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                        isActive
                                            ? "text-foreground bg-accent"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}

                        <div className="pt-3 border-t border-border space-y-2">
                            {session ? (
                                <>
                                    <Link href="/profile" onClick={() => setMobileOpen(false)}>
                                        <button className="flex items-center gap-2.5 w-full text-left px-4 py-3 text-sm font-medium text-foreground/90 hover:text-foreground rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all">
                                            <User className="h-4 w-4 text-blue-500" />
                                            {session.user?.name || "Profile"}
                                        </button>
                                    </Link>
                                    <button
                                        className="w-full text-left px-4 py-3 text-sm text-red-500/80 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-colors"
                                        onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <Link href="/auth" onClick={() => setMobileOpen(false)}>
                                    <button className="w-full px-5 py-2.5 text-sm font-semibold rounded-full bg-blue-500 hover:bg-blue-400 text-white transition-all">
                                        Get Started
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
