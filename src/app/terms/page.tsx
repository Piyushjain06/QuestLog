import { FileText, Scale, Accessibility, ServerCrash } from "lucide-react";

export const metadata = {
    title: "Terms of Service — QuestLog",
    description: "The terms and conditions for using QuestLog.",
};

export default function TermsPage() {
    return (
        <div className="flex flex-col items-center max-w-4xl mx-auto py-12 px-4 animate-fade-in text-left">
            {/* Header */}
            <div className="w-full text-left mb-16 relative">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/[0.06] px-4 py-1.5 text-xs font-medium text-indigo-400 mb-6 uppercase tracking-wider">
                    <Scale className="w-3.5 h-3.5" />
                    Legal Agreement
                </div>
                <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight mb-4 text-foreground">
                    Terms of Service
                </h1>
                <p className="text-lg text-muted-foreground w-full max-w-2xl font-display leading-relaxed">
                    By accessing or using QuestLog, you agree to be bound by these terms. We keep them straightforward and fair.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-muted-foreground/60 w-full font-medium font-mono uppercase tracking-widest">
                    <span>Effective: Initial Launch</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Version 1.0</span>
                </div>
            </div>

            {/* Quick Summary Highlights */}
            <div className="flex flex-col sm:flex-row gap-4 w-full mb-16">
                 {[
                    { icon: Accessibility, label: "Fair Use Policy" },
                    { icon: FileText, label: "User Content Ownership" },
                    { icon: ServerCrash, label: "No Uptime Guarantee" },
                ].map((item, i) => (
                    <div key={i} className="flex-1 rounded-xl border border-border bg-card/30 p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-semibold text-foreground/80">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Body content */}
            <article className="prose prose-invert prose-indigo max-w-none w-full border-t border-border pt-12 space-y-8 text-muted-foreground">
                <section>
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-4">
                        1. Acceptance of Terms
                    </h2>
                    <p>
                        By creating an account, you agree to these terms. QuestLog is provided "as is" and "as available". We reserve the right to suspend or terminate accounts that violate our fair use policies or attempt to exploit the platform's APIs.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-4">
                        2. User Conduct
                    </h2>
                    <p>
                        QuestLog includes social features like friendships and game reviews. We have a zero-tolerance policy for harassment, hate speech, or spam. Accounts engaging in malicious activity will be permanently banned.
                    </p>
                </section>

                 <section>
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-4">
                        3. Service Availability
                    </h2>
                    <p>
                        While we strive for high uptime, QuestLog relies on third-party APIs (IGDB, Steam, Epic) which may occasionally rate-limit or experience downtime. We are not liable for data syncing delays caused by upstream providers.
                    </p>
                </section>

                 <section>
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-4">
                        4. Intellectual Property
                    </h2>
                    <p>
                        Game metadata, cover arts, and promotional imagery belong to their respective copyright holders (fetched via IGDB/Twitch). The QuestLog brand, custom UI, and original code are the intellectual property of QuestLog Inc.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-4">
                        5. Changes to the Terms
                    </h2>
                    <p>
                        We may update these terms occasionally. For significant changes, we will notify users via the primary email address associated with their account. Continued use of the platform after updates constitutes acceptance.
                    </p>
                </section>
            </article>
        </div>
    );
}
