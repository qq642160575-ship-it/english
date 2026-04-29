"use client";

import { useMemo } from "react";
import { CharResult, LearningMode, WordItem, SentenceItem } from "@/data/types";

export interface IpaResult {
  typed: string;
  ipa: string;
}

export function computeWordIpaPrefix(item: WordItem, input: CharResult[]): IpaResult {
  const len = input.length;
  if (len === 0) return { typed: "", ipa: "" };
  const typed = input.map((i) => i.char).join("");
  const endIndex = item.ib[len - 1] ?? 0;
  return { typed, ipa: item.ipa.slice(0, endIndex) };
}

export function computeSentenceIpaPrefix(item: SentenceItem, input: CharResult[]): IpaResult {
  const typed = input.map((i) => i.char).join("");
  const words = item.en.split(" ");
  const spaceCount = (typed.match(/ /g) ?? []).length;
  const wordIndex = Math.min(spaceCount, words.length - 1);
  const wordData = item.iw[wordIndex];
  if (!wordData) return { typed: "", ipa: "" };
  const parts = typed.split(" ");
  const currentPart = parts[wordIndex] ?? "";
  const letterCount = currentPart.replace(/[^a-zA-Z]/g, "").length;
  if (letterCount === 0) return { typed: "", ipa: wordData.ipa ?? "" };
  return {
    typed: wordData.ipa.slice(0, wordData.ib[letterCount - 1]),
    ipa: wordData.ipa.slice(0, wordData.ib[letterCount - 1]),
  };
}

export function useIpaDisplay(
  mode: LearningMode,
  item: WordItem | SentenceItem | null,
  input: CharResult[],
  isComplete: boolean
): IpaResult {
  return useMemo(() => {
    if (!item || input.length === 0) return { typed: "", ipa: "" };
    if (mode === "word") {
      return computeWordIpaPrefix(item as WordItem, input);
    }
    return computeSentenceIpaPrefix(item as SentenceItem, input);
  }, [mode, item, input, isComplete]);
}
