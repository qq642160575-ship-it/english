"use client";

import { useState, useCallback } from "react";

export interface WordBookEntry {
  en: string;
  zh: string;
  ipa?: string;
  packId: string;
  addedAt: number;
}

const WORDBOOK_KEY = "keykey_wordbook";

function loadWordbook(): WordBookEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WORDBOOK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveWordbook(entries: WordBookEntry[]): void {
  try {
    localStorage.setItem(WORDBOOK_KEY, JSON.stringify(entries));
  } catch {}
}

export function useWordbook() {
  const [entries, setEntries] = useState<WordBookEntry[]>([]);

  const addEntry = useCallback((entry: WordBookEntry) => {
    setEntries((prev) => {
      if (prev.some((e) => e.en === entry.en)) return prev;
      const next = [entry, ...prev];
      saveWordbook(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((en: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.en !== en);
      saveWordbook(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (en: string) => entries.some((e) => e.en === en),
    [entries]
  );

  const toggleEntry = useCallback(
    (entry: WordBookEntry) => {
      if (entries.some((e) => e.en === entry.en)) {
        removeEntry(entry.en);
      } else {
        addEntry(entry);
      }
    },
    [entries, addEntry, removeEntry]
  );

  return {
    entries,
    addEntry,
    removeEntry,
    isBookmarked,
    toggleEntry,
    count: entries.length,
  };
}
