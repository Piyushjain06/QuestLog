"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Swords, Map, Star } from "lucide-react";

interface Mission {
    id: string;
    title: string;
    description: string | null;
    type: string;
    difficulty: string | null;
    xpReward: number;
    completed: boolean;
}

interface MissionListProps {
    missions: Mission[];
    onToggle?: (missionId: string, completed: boolean) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
    MAIN: <Swords className="h-4 w-4 text-neon-cyan" />,
    SIDE: <Map className="h-4 w-4 text-neon-purple" />,
    ACHIEVEMENT: <Trophy className="h-4 w-4 text-neon-orange" />,
    COLLECTIBLE: <Star className="h-4 w-4 text-neon-pink" />,
};

const difficultyColors: Record<string, string> = {
    EASY: "text-neon-green",
    MEDIUM: "text-neon-orange",
    HARD: "text-red-400",
};

export function MissionList({ missions, onToggle }: MissionListProps) {
    const [localMissions, setLocalMissions] = useState(missions);

    const completedCount = localMissions.filter((m) => m.completed).length;
    const progress = localMissions.length > 0 ? (completedCount / localMissions.length) * 100 : 0;
    const totalXp = localMissions.filter((m) => m.completed).reduce((sum, m) => sum + m.xpReward, 0);

    const handleToggle = (missionId: string) => {
        setLocalMissions((prev) =>
            prev.map((m) =>
                m.id === missionId ? { ...m, completed: !m.completed } : m
            )
        );
        const mission = localMissions.find((m) => m.id === missionId);
        if (mission) {
            onToggle?.(missionId, !mission.completed);
        }
    };

    return (
        <div className="space-y-4">
            {/* Progress header */}
            <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-display font-semibold text-lg">Mission Progress</h3>
                        <p className="text-sm text-muted-foreground">
                            {completedCount}/{localMissions.length} completed · {totalXp} XP earned
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-display font-bold gradient-text">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>
                <Progress value={progress} />
            </div>

            {/* Mission list */}
            <div className="space-y-2">
                {localMissions.map((mission) => (
                    <div
                        key={mission.id}
                        className={`glass-card p-4 flex items-start gap-3 transition-all duration-200 hover:bg-card/80 ${mission.completed ? "opacity-60" : ""
                            }`}
                    >
                        <Checkbox
                            checked={mission.completed}
                            onCheckedChange={() => handleToggle(mission.id)}
                            className="mt-0.5"
                        />

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                {typeIcons[mission.type]}
                                <span
                                    className={`font-medium text-sm ${mission.completed ? "line-through text-muted-foreground" : ""
                                        }`}
                                >
                                    {mission.title}
                                </span>
                                {mission.difficulty && (
                                    <span className={`text-xs font-medium ${difficultyColors[mission.difficulty] ?? ""}`}>
                                        {mission.difficulty}
                                    </span>
                                )}
                            </div>
                            {mission.description && (
                                <p className="text-xs text-muted-foreground mt-1">{mission.description}</p>
                            )}
                        </div>

                        <Badge variant="outline" className="shrink-0 text-xs">
                            +{mission.xpReward} XP
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    );
}
