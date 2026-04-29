"use client";

import { useEffect } from "react";

interface UseKeyboardOptions {
  onChar: (char: string) => void;
  onSpace: () => void;
  onBackspace: () => void;
  onEnter: () => void;
  enabled: boolean;
}

export function useKeyboard({
  onChar,
  onSpace,
  onBackspace,
  onEnter,
  enabled,
}: UseKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement) return;
      if (e.target instanceof HTMLInputElement) return;
      if (e.target instanceof HTMLTextAreaElement) return;
      if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onChar(e.key.toLowerCase());
      } else if (e.key === " ") {
        e.preventDefault();
        onSpace();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        onBackspace();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onEnter();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onChar, onSpace, onBackspace, onEnter, enabled]);
}
