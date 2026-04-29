"use client";

import { useState, useCallback, useMemo, useEffect } from "react";

export interface SRSItem {
  id: string;
  en: string;
  zh: string;
  packId: string;
  stage: number;
  lastReviewed: number;
  nextReview: number;
  correctStreak: number;
}

export interface SRSData {
  items: Record<string, SRSItem>;
  updatedAt: number;
}

const SRS_KEY = "keykey_srs_v1";

const INTERVALS_MS = [
  0,
  24 * 60 * 60 * 1000,      // stage 1: 1 天后
  3 * 24 * 60 * 60 * 1000,  // stage 2: 3 天后
  7 * 24 * 60 * 60 * 1000,  // stage 3: 7 天后（已掌握）
];

function loadSRS(): SRSData {
  if (typeof window === "undefined") return { items: {}, updatedAt: Date.now() };
  try {
    const raw = localStorage.getItem(SRS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { items: {}, updatedAt: Date.now() };
}

function saveSRS(data: SRSData): void {
  try {
    data.updatedAt = Date.now();
    localStorage.setItem(SRS_KEY, JSON.stringify(data));
  } catch {}
}

export function useSRS() {
  const [srsData, setSrsData] = useState<SRSData>({ items: {}, updatedAt: 0 });

  // Sync with localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    setSrsData(loadSRS());
  }, []);

  const dueItems = useMemo(() => {
    const now = Date.now();
    return Object.values(srsData.items)
      .filter((item) => item.nextReview <= now && item.stage < 3)
      .sort((a, b) => a.nextReview - b.nextReview);
  }, [srsData]);

  const addItem = useCallback((en: string, zh: string, packId: string, id: string) => {
    setSrsData((prev) => {
      if (prev.items[id]) return prev;
      const newItem: SRSItem = {
        id,
        en,
        zh,
        packId,
        stage: 0,
        lastReviewed: Date.now(),
        nextReview: Date.now(),
        correctStreak: 0,
      };
      const next = { ...prev, items: { ...prev.items, [id]: newItem } };
      saveSRS(next);
      return next;
    });
  }, []);

  const answerCorrect = useCallback((id: string) => {
    setSrsData((prev) => {
      const item = prev.items[id];
      if (!item) return prev;
      const nextStage = Math.min(item.stage + 1, 3);
      const updated: SRSItem = {
        ...item,
        stage: nextStage,
        correctStreak: item.correctStreak + 1,
        lastReviewed: Date.now(),
        nextReview: Date.now() + INTERVALS_MS[nextStage],
      };
      const next = { ...prev, items: { ...prev.items, [id]: updated } };
      saveSRS(next);
      return next;
    });
  }, []);

  const answerWrong = useCallback((id: string) => {
    setSrsData((prev) => {
      const item = prev.items[id];
      if (!item) return prev;
      const newStage = Math.max(item.stage - 1, 0);
      const updated: SRSItem = {
        ...item,
        stage: newStage,
        correctStreak: 0,
        lastReviewed: Date.now(),
        nextReview: Date.now() + INTERVALS_MS[newStage],
      };
      const next = { ...prev, items: { ...prev.items, [id]: updated } };
      saveSRS(next);
      return next;
    });
  }, []);

  const dueCount = dueItems.length;

  return {
    srsData,
    addItem,
    answerCorrect,
    answerWrong,
    dueItems,
    dueCount,
    totalItems: Object.keys(srsData.items).length,
  };
}
