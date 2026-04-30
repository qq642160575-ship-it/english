"use client";

import { cn } from "@/lib/utils";

interface KeyboardKeyProps {
  label: string;
  dataKey: string;
  isPressed: boolean;
  onClick: () => void;
  wide?: boolean;
  extraWide?: boolean;
  status?: "correct" | "wrong";
}

export function KeyboardKey({
  label,
  dataKey,
  isPressed,
  onClick,
  wide,
  extraWide,
  status,
}: KeyboardKeyProps) {
  return (
    <button
      data-key={dataKey}
      className={cn(
        "inline-flex items-center justify-center h-[44px] rounded-lg bg-[var(--key-bg)] text-[var(--key-text)] text-sm font-semibold cursor-pointer transition-all duration-100 ease-out border-none font-inherit select-none",
        "hover:bg-[var(--key-active)]/10 hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.92] active:translate-y-[1px]",
        isPressed && "bg-[var(--key-active)] text-[var(--key-active-text)] scale-[0.92] shadow-inner",
        status === "correct" && "bg-green-200 dark:bg-green-800/40 text-green-700 dark:text-green-300",
        status === "wrong" && "bg-red-200 dark:bg-red-800/40 text-red-600 dark:text-red-300",
        wide ? "w-[76px] text-[11px] font-medium uppercase tracking-[0.5px]" : "w-[40px]",
        extraWide && "w-[156px] text-[11px] font-medium uppercase tracking-[0.5px]"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
