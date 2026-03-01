import Link from "next/link";
import { Gamepad2, ArrowRight, Sparkles, Monitor, Swords, Zap, CheckCircle2 } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
    const session = await getServerSession(authOptions);
    const ctaHref = session ? "/profile" : "/auth";
    return (
        <div className="flex flex-col items-center -mt-8">
            {/* Hero section */}
            <section className="relative flex flex-col items-center text-center pt-24 pb-28 px-4 w-full overflow-hidden">
                {/* Subtle background radials */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/[0.06] rounded-full blur-[160px] pointer-events-none" />
                <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-indigo-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 max-w-4xl">
                    {/* Status badge */}
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-4 py-1.5 text-xs font-medium text-blue-400 mb-10 animate-fade-in tracking-wider uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        System Online — V1.0
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl lg:text-8xl font-display font-black tracking-tight mb-8 animate-slide-up leading-[0.95]">
                        Every mission<br />
                        <span className="italic font-serif gradient-text">curated.</span>
                    </h1>

                    <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-12 animate-slide-up leading-relaxed font-light">
                        The premium companion for the discerning gamer. Track your
                        achievements, catalog your library, and narrate your digital legacy.
                    </p>

                    {/* CTA buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center animate-slide-up">
                        <Link href={ctaHref}>
                            <button className="group px-8 py-3.5 text-sm font-semibold rounded-full bg-blue-500 hover:bg-blue-400 text-white transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-400/30 flex items-center gap-2">
                                Start Your Archive
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </Link>
                        <Link href="/discover">
                            <button className="px-8 py-3.5 text-sm font-semibold rounded-full border border-border bg-background hover:bg-accent text-foreground transition-all duration-200">
                                Discover Games
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Stats section */}
            <section className="w-full max-w-5xl pb-20 px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { value: "10k+", label: "Games Tracked", icon: Monitor },
                        { value: "100+", label: "Missions", icon: Swords },
                        { value: "5", label: "Platforms", icon: Gamepad2 },
                        { value: "AI", label: "Powered", icon: Zap },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className="glass-card p-6 text-center group hover:border-border transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-xl bg-accent/50 border border-border flex items-center justify-center mx-auto mb-4 group-hover:bg-accent transition-colors">
                                <stat.icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
                                {stat.value}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1.5 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Feature section */}
            <section className="w-full max-w-5xl pb-24 px-4">
                <div className="glass-card overflow-hidden">
                    <div className="grid lg:grid-cols-2 gap-0">
                        {/* Text side */}
                        <div className="p-10 lg:p-14 flex flex-col justify-center">
                            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight mb-5 leading-tight">
                                Designed for the<br />completionist.
                            </h2>
                            <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md">
                                Stop losing track of your progress. QuestLog synchronizes across
                                your devices to give you a beautiful timeline of your gaming history,
                                automatically enhanced by AI summaries.
                            </p>
                            <div className="space-y-4">
                                {[
                                    "Automatic Steam & Epic Sync",
                                    "AI-Generated Campaign Summaries",
                                    "Detailed Achievement Analytics",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                        <span className="text-sm text-foreground/80 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual side — game list preview */}
                        <div className="relative bg-gradient-to-br from-background/50 to-muted/20 p-8 lg:p-12 flex items-center justify-center min-h-[300px]">
                            <div className="w-full max-w-sm space-y-3">
                                {[
                                    { title: "The Witcher 3: Wild Hunt", status: "Completed", statusColor: "bg-blue-400", playtime: "142h", progress: 100 },
                                    { title: "Elden Ring", status: "Playing", statusColor: "bg-emerald-400", playtime: "87h", progress: 65 },
                                    { title: "Cyberpunk 2077", status: "Playing", statusColor: "bg-emerald-400", playtime: "53h", progress: 40 },
                                    { title: "Hollow Knight", status: "Backlog", statusColor: "bg-amber-400", playtime: "—", progress: 0 },
                                ].map((game, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-xl border border-border bg-card/50 p-4 transition-all hover:bg-accent/50 ${i === 3 ? "opacity-50" : ""}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-2 h-2 rounded-full ${game.statusColor}`} />
                                                <span className="text-sm font-medium text-foreground/80 truncate">{game.title}</span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-medium ml-2 flex-shrink-0">{game.playtime}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${game.statusColor}`}
                                                    style={{ width: `${game.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-medium">{game.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full border-t border-border mt-4">
                <div className="mx-auto max-w-5xl px-4 py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <Gamepad2 className="h-5 w-5 text-blue-500" />
                            <span className="text-sm font-display font-bold text-foreground/80">QuestLog</span>
                        </Link>

                        {/* Links */}
                        <div className="flex items-center gap-6 text-xs text-muted-foreground">
                            <span>Privacy</span>
                            <span>Terms</span>
                            <span>Changelog</span>
                            <span>Support</span>
                        </div>

                        {/* Built with */}
                        <p className="text-xs text-muted-foreground">
                            Built with <span className="text-red-500">♥</span> for the elite community.
                        </p>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 font-medium">
                            © 2026 QuestLog Inc. Elevating digital history.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
