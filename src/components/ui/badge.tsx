import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & {
        variant?: "default" | "playing" | "completed" | "dropped" | "backlog" | "outline";
    }
>(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "bg-primary/20 text-primary border-primary/30",
        playing: "bg-neon-green/15 text-neon-green border-neon-green/30",
        completed: "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30",
        dropped: "bg-red-500/15 text-red-400 border-red-500/30",
        backlog: "bg-neon-orange/15 text-neon-orange border-neon-orange/30",
        outline: "bg-transparent text-muted-foreground border-border",
    };

    return (
        <div
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                variants[variant],
                className
            )}
            {...props}
        />
    );
});
Badge.displayName = "Badge";

export { Badge };
