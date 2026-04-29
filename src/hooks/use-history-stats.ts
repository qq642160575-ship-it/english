"use client";

import { useCallback, useEffect, useState } from "react";

const HISTORY_KEY = "etl_history_stats";

export interface DayStats {
  date: string;
  completed: number;   // 单词/句子完成数
  errorWords: number;  // 其中出过错的词数
}

export interface HistoryStats {
  days: Record<string, DayStats>;
}

function loadStats(): HistoryStats {
  if (typeof window === "undefined") return { days: {} };
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { days: {} };
}

function saveStats(stats: HistoryStats) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(stats));
  } catch {}
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useHistoryStats() {
  const [stats, setStats] = useState<HistoryStats>(loadStats);

  // Sync from localStorage on mount
  useEffect(() => {
    setStats(loadStats());
  }, []);

  const recordCompletion = useCallback((hadErrors: boolean) => {
    setStats((prev) => {
      const key = todayKey();
      const today = prev.days[key] ?? { date: key, completed: 0, errorWords: 0 };
      const updated: HistoryStats = {
        ...prev,
        days: {
          ...prev.days,
          [key]: {
            ...today,
            completed: today.completed + 1,
            errorWords: today.errorWords + (hadErrors ? 1 : 0),
          },
        },
      };
      saveStats(updated);
      return updated;
    });
  }, []);

  const getLast7Days = useCallback((): DayStats[] => {
    const result: DayStats[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      result.push(stats.days[key] ?? { date: key, completed: 0, errorWords: 0 });
    }
    return result;
  }, [stats]);

  const totalCompleted = Object.values(stats.days).reduce((sum, d) => sum + d.completed, 0);

  return { stats, recordCompletion, getLast7Days, totalCompleted };
}
