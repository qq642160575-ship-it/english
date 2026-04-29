"use client";

import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  mounted: boolean;
}

export function ThemeToggle({ isDark, onToggle, mounted }: ThemeToggleProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      title="切换深色模式"
      className="w-9 h-9 rounded-lg"
    >
      {mounted ? (isDark ? "\u2600\ufe0f" : "\U0001f319") : " "}
    </Button>
  );
}
