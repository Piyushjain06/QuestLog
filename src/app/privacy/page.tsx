import { Shield, Lock, Eye, Database } from "lucide-react";

export const metadata = {
    title: "Privacy Policy — QuestLog",
    description: "Learn how we protect and manage your data at QuestLog.",
};

export default function PrivacyPage() {
    return (
        <div className="flex flex-col items-center max-w-4xl mx-auto py-12 px-4 animate-fade-in text-left">
            {/* Header */}
            <div className="w-full text-left mb-16 relative">
                <div className="absolute -top-24 -left-24 w-[300px] h-[300px] bg-blue-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-4 py-1.5 text-xs font-medium text-blue-400 mb-6 uppercase tracking-wider">
                    <Shield className="w-3.5 h-3.5" />
                    Data Protection
                </div>
                <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight mb-4 text-foreground">
                    Privacy Policy
                </h1>
                <p className="text-lg text-muted-foreground w-full max-w-2xl font-display leading-relaxed">
                    We believe your gaming history belongs to you. Here is exactly how we collect, store, and protect your digital legacy.
                </p>
                <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground/60 w-full font-medium font-mono uppercase tracking-widest">
                    Last Updated: March 28, 2026
                </div>
            </div>

            {/* Core Pillars */}
            <div className="grid sm:grid-cols-2 gap-4 w-full mb-16">
                {[
                    { icon: Lock, title: "Secure Storage", desc: "Industry-standard encryption for all user credentials and integration tokens." },
                    { icon: Eye, title: "No Third-party Tracking", desc: "We don't sell your library stats or playtimes to advertising networks." },
                ].map((item, i) => (
                    <div key={i} className="glass-card p-6 flex flex-col items-start hover:border-border transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                            <item.icon className="h-5 w-5 text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Body content */}
            <article className="prose prose-invert prose-blue max-w-none w-full border-t border-border pt-12 space-y-8 text-muted-foreground">
                <section>
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-400" />
                        1. Information We Collect
                    </h2>
                    <p>
                        When you create a QuestLog account, we collect basic profile information such as your email address, username, and profile picture. When you connect external integrations like Steam or Epic Games, we retrieve your public profile data, game library, achievements, and playtimes to populate your archive.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        2. How We Use Your Data
                    </h2>
                    <p>
                        Your data is solely used to provide the QuestLog experience. This includes rendering your library, computing analytics, generating AI-powered campaign summaries, and enabling the social friendship system. We do not use your library data for targeted advertising out of our ecosystem.
                    </p>
                </section>

                 <section>
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-4">
                        3. External Integrations
                    </h2>
                    <p>
                        Our syncing mechanisms use the official APIs provided by Steam, Epic Games, and IGDB. By linking your accounts, you agree to the read-only use of your data through these services. You may revoke access from within your QuestLog settings at any time, which will cease any further data ingestion.
                    </p>
                </section>

                 <section>
                    <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-4">
                        4. Data Deletion
                    </h2>
                    <p>
                        You have the right to be forgotten. Deleting your QuestLog account from the settings panel immediately cascades and permanently purges all linked data, library entries, and cached integrations from our servers.
                    </p>
                </section>
            </article>
        </div>
    );
}
