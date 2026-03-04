"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Search, Sparkles, User, Menu, X, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
    { href: "/discover", label: "Discover" },
    { href: "/profile", label: "Library" },
    { href: "/users", label: "Social" },
];

export function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { data: session } = useSession();

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
                        {navLinks.map((link) => {
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
                        {navLinks.map((link) => {
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
