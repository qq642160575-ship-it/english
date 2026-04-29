"use client";

import { useState, useEffect, useCallback } from "react";
import { DARK_KEY } from "@/lib/constants";

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(DARK_KEY) === "true";
    setIsDark(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    localStorage.setItem(DARK_KEY, String(isDark));
  }, [isDark, mounted]);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle, mounted };
}
