"use client";

import { useState, useTransition } from "react";
import { Sparkles, Clock, Loader2, AlertTriangle, RotateCcw, Cpu } from "lucide-react";
import { predictTime, type PredictTimeInput } from "@/app/actions/predictTime";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PredictorWidgetProps {
    /** Genres array from the game — used to auto-detect RPG and multiplayer flags. */
    genres: string[];
    /** Themes / tags array — also used for multiplayer detection. */
    themes?: string[];
    /** IGDB aggregate review score, already on the 0–100 scale (total_rating). */
    reviewScore?: number | null;
    /** Game title — shown inside the widget for clarity. */
    gameTitle?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// IGDB genre names we treat as RPG:
// "Role-playing (RPG)", "JRPG", "WRPG", "Hack and slash/Beat 'em up" (sometimes tagged RPG)
const RPG_GENRE_PATTERNS = [
    "role-playing",
    "rpg",    // matches "Role-playing (RPG)" and standalone
    "jrpg",
    "wrpg",
];

// IGDB genre / theme names that imply multiplayer-focused gameplay
const MULTIPLAYER_PATTERNS = [
    "battle royale",
    "mmo",
    "mmorpg",
    "massively multiplayer",
    "sport",  // sports games are inherently multi
    "racing", // same
    "fighting",
    "co-operative",
    "co-op",
    "online",
    "multiplayer",
    "pvp",
];

function detectRpg(genres: string[], themes: string[]): number {
    const all = [...genres, ...themes].map((s) => s.toLowerCase());
    return all.some((s) => RPG_GENRE_PATTERNS.some((kw) => s.includes(kw))) ? 1 : 0;
}

function detectMultiplayer(genres: string[], themes: string[]): number {
    const all = [...genres, ...themes].map((s) => s.toLowerCase());
    return all.some((s) => MULTIPLAYER_PATTERNS.some((kw) => s.includes(kw))) ? 1 : 0;
}

function formatHours(h: number): string {
    if (h < 1) return `${Math.round(h * 60)} min`;
    if (h < 10) return `${h.toFixed(1)} hrs`;
    return `${Math.round(h)} hrs`;
}

/** Maps predicted hours to a rough pace label. */
function paceLabel(h: number): { label: string; color: string } {
    if (h < 5) return { label: "Short & Sweet", color: "text-neon-green" };
    if (h < 15) return { label: "Compact", color: "text-neon-cyan" };
    if (h < 40) return { label: "Mid-Length", color: "text-neon-purple" };
    if (h < 80) return { label: "Epic", color: "text-neon-orange" };
    return { label: "Marathon", color: "text-red-400" };
}

// ─── Component ────────────────────────────────────────────────────────────────

type UIState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; hours: number }
    | { status: "error" };

export function PredictorWidget({
    genres,
    themes = [],
    reviewScore,
    gameTitle,
}: PredictorWidgetProps) {
    const [ui, setUi] = useState<UIState>({ status: "idle" });
    const [isPending, startTransition] = useTransition();

    const isRpg = detectRpg(genres, themes);
    const isMultiplayer = detectMultiplayer(genres, themes);

    // game.rating from IGDB is already 0–100 (total_rating stored as a string "88.5").
    // Clamp to valid range; default to 70 ("average game") if unknown.
    const score = reviewScore != null
        ? Math.min(100, Math.max(0, reviewScore))
        : 70;

    const handlePredict = () => {
        setUi({ status: "loading" });

        const input: PredictTimeInput = {
            is_rpg: isRpg,
            is_multiplayer: isMultiplayer,
            review_score: score,
        };

        startTransition(async () => {
            const result = await predictTime(input);
            if (result === null) {
                setUi({ status: "error" });
            } else {
                setUi({ status: "success", hours: result.predicted_hours_to_beat });
            }
        });
    };

    const handleReset = () => setUi({ status: "idle" });

    const isLoading = ui.status === "loading" || isPending;

    return (
        <div className="glass-card overflow-hidden border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.07)] animate-fade-in">
            {/* Header strip */}
            <div className="relative px-5 py-4 border-b border-white/5 bg-gradient-to-r from-indigo-500/10 via-transparent to-emerald-500/5">
                {/* Subtle animated background orb */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl animate-glow-pulse" />
                    <div className="absolute -top-4 right-8 w-20 h-20 rounded-full bg-emerald-500/8 blur-xl" />
                </div>

                <div className="relative flex items-center gap-2.5">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/30 to-emerald-500/20 border border-indigo-400/20 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                        <Cpu className="h-4 w-4 text-indigo-300" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest leading-none">
                            AI Predictor
                        </p>
                        <h3 className="text-sm font-display font-bold text-foreground mt-0.5">
                            Time-to-Beat Estimate
                        </h3>
                    </div>
                    {/* Live badge */}
                    <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 text-xs text-emerald-400 font-medium">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        ML
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
                {/* Feature pills — shows the model inputs at-a-glance */}
                <div className="flex flex-wrap gap-2">
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        isRpg
                            ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                            : "bg-white/5 border-white/10 text-muted-foreground"
                    }`}>
                        <span>{isRpg ? "⚔️" : "🎮"}</span>
                        {isRpg ? "RPG" : "Non-RPG"}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        isMultiplayer === 1
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                            : "bg-white/5 border-white/10 text-muted-foreground"
                    }`}>
                        <span>{isMultiplayer === 1 ? "👥" : "🧍"}</span>
                        {isMultiplayer === 1 ? "Multiplayer" : "Single-player"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-white/5 border-white/10 text-muted-foreground">
                        <span>⭐</span>
                        Score: {score.toFixed(0)}/100
                    </span>
                </div>

                {/* State machine display */}

                {/* ── IDLE ─────────────────────────────────────────── */}
                {ui.status === "idle" && (
                    <button
                        id="predict-time-to-beat-btn"
                        onClick={handlePredict}
                        disabled={isLoading}
                        className="group w-full relative flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-semibold text-sm overflow-hidden transition-all duration-300
                            bg-gradient-to-r from-indigo-600 to-indigo-500
                            hover:from-indigo-500 hover:to-emerald-600
                            text-white shadow-[0_4px_20px_rgba(99,102,241,0.35)]
                            hover:shadow-[0_4px_30px_rgba(99,102,241,0.55)]
                            hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {/* Shimmer sweep on hover */}
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                        <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                        Generate AI Prediction
                    </button>
                )}

                {/* ── LOADING ──────────────────────────────────────── */}
                {(ui.status === "loading" || isLoading) && ui.status !== "success" && ui.status !== "error" && (
                    <div className="flex flex-col items-center gap-3 py-2 animate-fade-in">
                        {/* Spinning rings */}
                        <div className="relative w-14 h-14">
                            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin" />
                            <div className="absolute inset-1.5 rounded-full border-t-2 border-emerald-400/60 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 text-indigo-300 animate-spin" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-indigo-300">Calculating...</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Running the Random Forest model
                            </p>
                        </div>
                        {/* Animated dots */}
                        <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <span
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── SUCCESS ──────────────────────────────────────── */}
                {ui.status === "success" && !isLoading && (
                    <div className="space-y-4 animate-slide-up">
                        {/* Result card */}
                        <div className="relative rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-transparent to-indigo-500/8 p-4 text-center overflow-hidden">
                            {/* Background glow */}
                            <div className="pointer-events-none absolute inset-0">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-indigo-500/5" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl" />
                            </div>

                            <div className="relative space-y-1">
                                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400/80 font-semibold uppercase tracking-widest mb-2">
                                    <Clock className="h-3 w-3" />
                                    Estimated Playtime
                                </div>

                                {/* Big number */}
                                <p className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 via-emerald-400 to-indigo-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                                    {formatHours(ui.hours)}
                                </p>

                                {/* Pace badge */}
                                <p className={`text-sm font-semibold mt-1 ${paceLabel(ui.hours).color}`}>
                                    {paceLabel(ui.hours).label}
                                </p>

                                {gameTitle && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        to beat{" "}
                                        <span className="text-foreground/70 font-medium">
                                            {gameTitle}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Disclaimer + retry */}
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground/60">
                                ⚠️ AI estimate — actual time may vary
                            </p>
                            <button
                                id="predict-time-reset-btn"
                                onClick={handleReset}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-indigo-300 transition-colors duration-200"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Re-run
                            </button>
                        </div>
                    </div>
                )}

                {/* ── ERROR ────────────────────────────────────────── */}
                {ui.status === "error" && !isLoading && (
                    <div className="space-y-3 animate-fade-in">
                        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3.5">
                            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-red-300">
                                    Predictor Unavailable
                                </p>
                                <p className="text-xs text-red-400/70 mt-0.5">
                                    The ML service couldn&apos;t be reached. Make sure the
                                    FastAPI server is running on port 8000.
                                </p>
                            </div>
                        </div>
                        <button
                            id="predict-time-retry-btn"
                            onClick={handlePredict}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-500/20 text-sm text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all duration-200"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
