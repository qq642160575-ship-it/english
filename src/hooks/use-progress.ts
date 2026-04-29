"use client";

import { useCallback } from "react";
import { GameState, StoredProgress } from "@/data/types";
import { STORAGE_KEY } from "@/lib/constants";

function loadFromStorage(): StoredProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { word: {}, sentence: {} };
    return JSON.parse(raw);
  } catch {
    return { word: {}, sentence: {} };
  }
}

export function useProgress() {
  const save = useCallback((state: GameState) => {
    try {
      const data = loadFromStorage();
      const modeKey = state.mode;
      const categoryKey = `${state.category}`;
      const chapterKey = `ch${state.chapter}`;
      if (!data[modeKey][categoryKey]) {
        data[modeKey][categoryKey] = {};
      }
      data[modeKey][categoryKey][chapterKey] = {
        index: state.index,
        completed: Array.from(new Set(state.completedIndices)),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* silent fail */
    }
  }, []);

  const load = useCallback(
    (
      mode: "word" | "sentence",
      category: string,
      chapter: number = 1
    ): { index: number; completedIndices: number[] } | null => {
      try {
        const data = loadFromStorage();
        const saved = data[mode]?.[category]?.[`ch${chapter}`];
        if (!saved) return null;
        return {
          index: saved.index ?? 0,
          completedIndices: saved.completed ?? [],
        };
      } catch {
        return null;
      }
    },
    []
  );

  const resetStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { save, load, resetStorage };
}
