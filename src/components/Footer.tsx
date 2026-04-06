import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export function Footer() {
    return (
        <footer className="w-full border-t border-border mt-auto">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
                        <Gamepad2 className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-sm font-display font-bold text-foreground/80 group-hover:text-foreground transition-colors">
                            QuestLog
                        </span>
                    </Link>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                        <Link href="/changelog" className="hover:text-foreground transition-colors">Changelog</Link>
                        <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
                    </div>

                    {/* Built with */}
                    <p className="text-xs text-muted-foreground hidden md:block">
                        Built with <span className="text-red-500 animate-pulse inline-block">♥</span> for the elite community.
                    </p>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 font-medium">
                        © {new Date().getFullYear()} QuestLog Inc. Elevating digital history.
                    </p>
                </div>
            </div>
        </footer>
    );
}
