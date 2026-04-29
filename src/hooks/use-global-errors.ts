"use client";

import { useState, useCallback, useEffect } from "react";

export interface GlobalErrorEntry {
  en: string;
  zh: string;
  ipa: string;
  packId: string;
  errorCount: number;
  lastErrorAt: number;
  firstErrorAt: number;
}

export interface GlobalErrorsData {
  words: Record<string, GlobalErrorEntry>;
  updatedAt: number;
}

const STORAGE_KEY = "etl_global_errors";

function loadErrors(): GlobalErrorsData {
  if (typeof window === "undefined") return { words: {}, updatedAt: Date.now() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { words: {}, updatedAt: Date.now() };
}

function saveErrors(data: GlobalErrorsData): void {
  try {
    data.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function useGlobalErrors() {
  const [errorData, setErrorData] = useState<GlobalErrorsData>({ words: {}, updatedAt: 0 });

  useEffect(() => {
    setErrorData(loadErrors());
  }, []);

  const recordError = useCallback((en: string, zh: string, ipa: string, packId: string) => {
    const id = `${packId}::${en}`;
    setErrorData((prev) => {
      const existing = prev.words[id];
      const entry: GlobalErrorEntry = {
        en,
        zh,
        ipa,
        packId,
        errorCount: existing ? existing.errorCount + 1 : 1,
        lastErrorAt: Date.now(),
        firstErrorAt: existing ? existing.firstErrorAt : Date.now(),
      };
      const next = { ...prev, words: { ...prev.words, [id]: entry } };
      saveErrors(next);
      return next;
    });
  }, []);

  const clearError = useCallback((en: string, packId: string) => {
    const id = `${packId}::${en}`;
    setErrorData((prev) => {
      const { [id]: _, ...rest } = prev.words;
      const next = { ...prev, words: rest };
      saveErrors(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    const next = { words: {}, updatedAt: Date.now() };
    saveErrors(next);
    setErrorData(next);
  }, []);

  /** Get all error words sorted by errorCount descending, for review */
  const errorItems = Object.values(errorData.words)
    .sort((a, b) => b.errorCount - a.errorCount);

  return {
    errorData,
    recordError,
    clearError,
    clearAll,
    errorItems,
    errorCount: errorItems.length,
  };
}
