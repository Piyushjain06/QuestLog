import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-neon-cyan" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading Game Data...</p>
        </div>
    );
}
