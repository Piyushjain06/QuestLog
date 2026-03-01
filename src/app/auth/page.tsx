"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Gamepad2, LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AuthPage() {
    const router = useRouter();
    const [tab, setTab] = useState<"login" | "signup">("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Login state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Signup state
    const [signupName, setSignupName] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupConfirm, setSignupConfirm] = useState("");
    const [showSignupPassword, setShowSignupPassword] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                email: loginEmail,
                password: loginPassword,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid email or password.");
            } else {
                router.push("/profile");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (signupPassword !== signupConfirm) {
            setError("Passwords do not match.");
            return;
        }

        if (signupPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: signupName,
                    email: signupEmail,
                    password: signupPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Signup failed.");
                return;
            }

            // Auto-login after signup
            const signInRes = await signIn("credentials", {
                email: signupEmail,
                password: signupPassword,
                redirect: false,
            });

            if (signInRes?.error) {
                setError("Account created but login failed. Please try logging in.");
                setTab("login");
            } else {
                router.push("/profile");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative">
            {/* Background glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-20 right-1/3 w-[350px] h-[350px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 mb-4">
                        <Gamepad2 className="w-8 h-8 text-neon-cyan" />
                    </div>
                    <h1 className="text-3xl font-display font-bold mb-2">
                        Welcome to <span className="gradient-text">QuestLog</span>
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Sign in to track your quests and conquer your backlog
                    </p>
                </div>

                {/* Card */}
                <div className="glass-card glow-border p-6">
                    {/* Tabs */}
                    <div className="flex rounded-lg bg-background/50 p-1 mb-6 border border-white/5">
                        <button
                            onClick={() => { setTab("login"); setError(""); }}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all duration-200 ${tab === "login"
                                    ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-sm shadow-neon-cyan/10"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <LogIn className="w-4 h-4" />
                            Log In
                        </button>
                        <button
                            onClick={() => { setTab("signup"); setError(""); }}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-all duration-200 ${tab === "signup"
                                    ? "bg-neon-purple/10 text-neon-purple border border-neon-purple/20 shadow-sm shadow-neon-purple/10"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <UserPlus className="w-4 h-4" />
                            Sign Up
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                            <span className="mt-0.5">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    {tab === "login" && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="login-email" className="text-sm font-medium text-foreground/80">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder="gamer@questlog.dev"
                                        required
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background/50 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/30 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="login-password" className="text-sm font-medium text-foreground/80">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="login-password"
                                        type={showLoginPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        required
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-background/50 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:border-neon-cyan/30 transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-cyan/80 text-background font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <LogIn className="w-4 h-4" />
                                )}
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>
                    )}

                    {/* Signup Form */}
                    {tab === "signup" && (
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="signup-name" className="text-sm font-medium text-foreground/80">
                                    Display Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-name"
                                        type="text"
                                        placeholder="QuestLog Gamer"
                                        required
                                        value={signupName}
                                        onChange={(e) => setSignupName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background/50 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/30 focus:border-neon-purple/30 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="signup-email" className="text-sm font-medium text-foreground/80">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        required
                                        value={signupEmail}
                                        onChange={(e) => setSignupEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background/50 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/30 focus:border-neon-purple/30 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="signup-password" className="text-sm font-medium text-foreground/80">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-password"
                                        type={showSignupPassword ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        required
                                        value={signupPassword}
                                        onChange={(e) => setSignupPassword(e.target.value)}
                                        className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-background/50 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/30 focus:border-neon-purple/30 transition-all text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="signup-confirm" className="text-sm font-medium text-foreground/80">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        id="signup-confirm"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={signupConfirm}
                                        onChange={(e) => setSignupConfirm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background/50 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/30 focus:border-neon-purple/30 transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <UserPlus className="w-4 h-4" />
                                )}
                                {loading ? "Creating account..." : "Create Account"}
                            </button>
                        </form>
                    )}

                    {/* Divider hint */}
                    <p className="text-center text-xs text-muted-foreground mt-5">
                        {tab === "login"
                            ? "Don't have an account? "
                            : "Already have an account? "}
                        <button
                            onClick={() => { setTab(tab === "login" ? "signup" : "login"); setError(""); }}
                            className="text-neon-cyan hover:underline font-medium"
                        >
                            {tab === "login" ? "Sign up" : "Log in"}
                        </button>
                    </p>
                </div>

                {/* Demo credentials hint */}
                <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground/60">
                        Demo: <span className="text-muted-foreground font-mono">gamer@questlog.dev</span> / <span className="text-muted-foreground font-mono">password123</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
