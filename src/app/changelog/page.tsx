import { History, GitCommit, Rocket, Bug } from "lucide-react";

export const metadata = {
    title: "Changelog — QuestLog",
    description: "New updates and improvements to QuestLog.",
};

const RELEASES = [
    {
        version: "v1.0.0",
        date: "March 28, 2026",
        badge: "Initial Release",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: Rocket,
        iconColor: "text-emerald-400",
        features: [
            "Launched the official public version of QuestLog.",
            "Integrated IGDB for comprehensive game metadata search.",
            "Added Steam Profile integration to fetch active games and playtimes.",
            "Built the interactive Discovery dashboard and core profile logic."
        ],
        fixes: []
    },
    {
        version: "Beta 0.9.x",
        date: "Early March 2026",
        badge: "Beta",
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        icon: GitCommit,
        iconColor: "text-blue-400",
        features: [
            "Introduced custom game lists and advanced genre filtering.",
            "Added experimental 'Missions' system to track granular campaign goals.",
            "Implemented NextAuth for secure Discord and Email authentication."
        ],
        fixes: [
            "Resolved rate-limiting issues when syncing bulky Steam libraries.",
            "Fixed layout shifts on the landing page during hydration.",
            "Removed deprecated legacy database schemas."
        ]
    }
]

export default function ChangelogPage() {
    return (
        <div className="flex flex-col items-center max-w-4xl mx-auto py-12 px-4 animate-fade-in text-left">
            {/* Header */}
            <div className="w-full text-left mb-16 relative">
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-1.5 text-xs font-medium text-emerald-400 mb-6 uppercase tracking-wider">
                    <History className="w-3.5 h-3.5" />
                    Updates
                </div>
                <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight mb-4 text-foreground">
                    Changelog
                </h1>
                <p className="text-lg text-muted-foreground w-full max-w-2xl font-display leading-relaxed">
                    A historical record of every new feature, bug fix, and performance improvement shipped to QuestLog.
                </p>
            </div>

            {/* Timeline */}
            <div className="w-full relative border-l border-border/60 pl-8 ml-4 sm:ml-0 space-y-16">
                {RELEASES.map((release, idx) => (
                    <div key={idx} className="relative">
                        {/* Timeline node */}
                        <div className="absolute -left-[45px] top-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full ${release.badgeColor.split(' ')[0].replace('/10', '')}`} />
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mb-4">
                            <h2 className="text-2xl font-display font-bold text-foreground">
                                {release.version}
                            </h2>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-widest ${release.badgeColor}`}>
                                {release.badge}
                            </div>
                            <span className="text-sm font-mono text-muted-foreground/60 w-full sm:w-auto">
                                {release.date}
                            </span>
                        </div>

                        <div className="glass-card p-6 sm:p-8 space-y-8">
                            {/* Features */}
                            {release.features.length > 0 && (
                                <div>
                                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest mb-4 text-foreground">
                                        <release.icon className={`w-4 h-4 ${release.iconColor}`} />
                                        New Features
                                    </h3>
                                    <ul className="space-y-3">
                                        {release.features.map((feat, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                                <span className="text-border mt-1.5">•</span>
                                                <span className="leading-relaxed">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Fixes */}
                            {release.fixes.length > 0 && (
                                <div className="pt-2">
                                     <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest mb-4 text-foreground/80">
                                        <Bug className="w-4 h-4 text-amber-400" />
                                        Fixes & Improvements
                                    </h3>
                                    <ul className="space-y-3">
                                        {release.fixes.map((fix, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                                <span className="text-border mt-1.5">•</span>
                                                <span className="leading-relaxed">{fix}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
