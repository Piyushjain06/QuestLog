import { LifeBuoy, Mail, MessageSquare, Twitter } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Support — QuestLog",
    description: "Get help and find answers to your questions about QuestLog.",
};

const FAQ = [
    {
        q: "Why isn't my Steam library syncing properly?",
        a: "Ensure your Steam profile privacy settings are set to 'Public'. Private profiles cannot be accessed by our API."
    },
    {
        q: "Do you support PlayStation / Xbox?",
        a: "Currently, we offer automated sync for Steam and Epic Games. Console integrations are actively being researched for future updates."
    },
    {
        q: "How do I reset my password?",
        a: "If you logged in via Discord, manage your credentials there. If using email, click 'Forgot Password' on the login screen to receive a reset link."
    },
    {
        q: "Can I delete a game from my library?",
        a: "Yes, go to the game's detail page or your profile library, click the options menu (three dots), and select 'Remove from Library'."
    }
];

export default function SupportPage() {
    return (
        <div className="flex flex-col items-center max-w-4xl mx-auto py-12 px-4 animate-fade-in text-left">
            {/* Header */}
            <div className="w-full text-center mb-16 relative flex flex-col items-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-amber-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
                <div className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-4 py-1.5 text-xs font-medium text-amber-400 mb-6 uppercase tracking-wider">
                    <LifeBuoy className="w-3.5 h-3.5" />
                    Help Center
                </div>
                <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight mb-4 text-foreground">
                    Get Support
                </h1>
                <p className="text-lg text-muted-foreground w-full max-w-xl text-center font-display leading-relaxed">
                    Need help managing your archive? Check the FAQ or reach out to our community. We're here to assist.
                </p>
            </div>

            {/* Support Channels */}
            <div className="grid sm:grid-cols-2 gap-4 w-full mb-20">
                <Link href="mailto:questlog.support@gmail.com" className="glass-card group p-8 flex flex-col items-center text-center hover:border-amber-500/30 transition-all hover:bg-accent/30 cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Mail className="h-6 w-6 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2">Email Support</h3>
                    <p className="text-sm text-muted-foreground mb-4">Direct assistance for account billing, data deletion, or severe bugs.</p>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest mt-auto">questlog.support@gmail.com</span>
                </Link>

                <Link href="https://discord.gg/P78K745s" target="_blank" rel="noopener noreferrer" className="glass-card group p-8 flex flex-col items-center text-center hover:border-blue-500/30 transition-all hover:bg-accent/30 cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                        <MessageSquare className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2">Discord Community</h3>
                    <p className="text-sm text-muted-foreground mb-4">Chat with other players, suggest features, and get quick answers from mods.</p>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-auto">Join Server</span>
                </Link>
            </div>

            {/* FAQ Section */}
            <div className="w-full">
                <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-8 pl-2 border-l-2 border-amber-500">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                    {FAQ.map((item, i) => (
                        <div key={i} className="glass-card p-6 flex flex-col items-start hover:border-border transition-colors">
                            <h3 className="font-semibold text-foreground mb-2 text-lg">{item.q}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
