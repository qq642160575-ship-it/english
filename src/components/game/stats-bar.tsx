"use client";

import { GameStats } from "@/data/types";

interface StatsBarProps {
  stats: GameStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="flex justify-center gap-5 text-xs text-muted-foreground">
      <span>字母 {stats.letters}</span>
      <span>正确 {stats.correct}</span>
      <span>错误 {stats.errors}</span>
    </div>
  );
}
