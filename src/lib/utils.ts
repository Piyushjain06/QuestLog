import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 100);
}

export function parseJsonField<T>(value: string, fallback: T): T {
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

export function formatPlaytime(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 100) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours)}h`;
}

export const STATUS_CONFIG = {
    PLAYING: { label: "Playing", color: "bg-neon-green", textColor: "text-neon-green" },
    COMPLETED: { label: "Completed", color: "bg-neon-cyan", textColor: "text-neon-cyan" },
    DROPPED: { label: "Dropped", color: "bg-red-500", textColor: "text-red-500" },
    BACKLOG: { label: "Backlog", color: "bg-neon-orange", textColor: "text-neon-orange" },
    PLANNING: { label: "Planning", color: "bg-violet-500", textColor: "text-violet-400" },
} as const;

export type GameStatus = keyof typeof STATUS_CONFIG;
