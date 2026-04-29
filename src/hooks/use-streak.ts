"use client";

import { useState, useCallback, useEffect } from "react";

const STREAK_KEY = "keykey_streak";

export interface StreakData {
  lastActiveDate: string;
  currentStreak: number;
  longestStreak: number;
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>({ lastActiveDate: "", currentStreak: 0, longestStreak: 0 });

  // Sync with localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    setStreak(loadStreak());
  }, []);

  const markActive = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setStreak((prev) => {
      if (prev.lastActiveDate === today) return prev;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      const newStreak =
        prev.lastActiveDate === yesterdayStr
          ? prev.currentStreak + 1
          : 1;

      const newData: StreakData = {
        lastActiveDate: today,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
      };

      try {
        localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
      } catch {}

      return newData;
    });
  }, []);

  return { streak, markActive };
}
