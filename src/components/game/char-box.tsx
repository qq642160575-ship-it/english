"use client";

import { cn } from "@/lib/utils";

interface CharBoxProps {
  char: string;
  status: "empty" | "correct" | "incorrect";
  isCurrent: boolean;
}

export function CharBox({ char, status, isCurrent }: CharBoxProps) {
  const isSpace = char === " ";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-[34px] h-[40px] text-[22px] font-semibold rounded-[6px] transition-all duration-100",
        status === "empty" && "text-muted-foreground",
        status === "correct" && "bg-[var(--correct-bg)] text-[var(--correct-text)]",
        status === "incorrect" && "bg-[var(--error-bg)] text-[var(--error-text)]",
        isCurrent && status === "empty" && "shadow-[inset_0_-3px_0_var(--current-border)] rounded-none",
        isSpace && "w-[18px] min-w-[18px]"
      )}
    >
      {isSpace ? "\u00A0" : char}
    </span>
  );
}
