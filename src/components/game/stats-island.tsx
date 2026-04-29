"use client";

import { GameStats } from "@/data/types";
import { cn } from "@/lib/utils";

interface StatsIslandProps {
  stats: GameStats;
  time?: string; // e.g. "00:00"
}

export function StatsIsland({ stats, time = "00:00" }: StatsIslandProps) {
  const accuracy = stats.letters > 0 ? Math.round((stats.correct / stats.letters) * 100) : 0;
  
  return (
    <div className="flex items-center gap-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl px-12 py-4 rounded-3xl">
      <StatItem value={time} label="time" />
      <StatItem value="0" label="w.p.m" />
      <StatItem value={`${accuracy}`} label="acc." />
      <StatItem value={stats.correct.toString()} label="correct" />
      <StatItem value={stats.errors.toString()} label="errors" />
    </div>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{label}</span>
    </div>
  );
}
