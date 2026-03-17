import Image from "next/image";
import { format } from "date-fns";
import { Trophy, Lock } from "lucide-react";

export interface Achievement {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    iconUrl: string | null;
    iconGrayUrl: string | null;
    hidden: boolean;
    unlockedAt?: Date | null;
}

interface AchievementListProps {
    achievements: Achievement[];
}

export function AchievementList({ achievements }: AchievementListProps) {
    if (achievements.length === 0) return null;

    // Sort unlocked first, then locked. Within those sorts, respect initial order (alphabetical usually).
    const sorted = [...achievements].sort((a, b) => {
        if (a.unlockedAt && !b.unlockedAt) return -1;
        if (!a.unlockedAt && b.unlockedAt) return 1;
        if (a.unlockedAt && b.unlockedAt) return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime(); // newest first
        return a.displayName.localeCompare(b.displayName);
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map((ach) => {
                const isUnlocked = !!ach.unlockedAt;
                const isHidden = ach.hidden && !isUnlocked;
                
                // Which icon to use
                const icon = isUnlocked && ach.iconUrl ? ach.iconUrl 
                             : ach.iconGrayUrl ? ach.iconGrayUrl 
                             : ach.iconUrl;

                return (
                    <div 
                        key={ach.id} 
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                            isUnlocked 
                                ? "glass-card border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40" 
                                : "glass-card border-border/40 opacity-70 hover:opacity-100"
                        }`}
                    >
                        {/* 64x64 Icon Container */}
                        <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-[#121212] border border-white/5 shadow-md flex items-center justify-center">
                            {icon ? (
                                <Image
                                    src={icon}
                                    alt={ach.displayName}
                                    fill
                                    className={`object-cover transition-all duration-500 ${!isUnlocked ? 'grayscale opacity-60' : ''}`}
                                    unoptimized // Steam CDN images often don't need Next.js optimization processing
                                />
                            ) : (
                                <Trophy className={`w-6 h-6 ${isUnlocked ? 'text-violet-400' : 'text-muted-foreground'}`} />
                            )}
                            
                            {/* Locked Overlay */}
                            {!isUnlocked && (
                                <div className="absolute inset-0 bg-background/20 flex items-center justify-center backdrop-blur-[1px]">
                                    <Lock className="w-5 h-5 text-white/50 drop-shadow-md" />
                                </div>
                            )}
                        </div>

                        {/* Text Container */}
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm leading-tight truncate ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {isHidden ? "Hidden Achievement" : ach.displayName}
                            </h4>
                            
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {isHidden ? "Keep playing to reveal this hidden achievement." : ach.description}
                            </p>
                            
                            {isUnlocked && ach.unlockedAt && (
                                <p className="text-[10px] font-medium text-violet-400/80 mt-1.5 flex items-center gap-1">
                                    <Trophy className="w-3 h-3" />
                                    Unlocked {format(new Date(ach.unlockedAt), "MMM d, yyyy")}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
