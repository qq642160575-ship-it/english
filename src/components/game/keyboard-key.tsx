"use client";

import { cn } from "@/lib/utils";

interface KeyboardKeyProps {
  label: string;
  dataKey: string;
  isPressed: boolean;
  onClick: () => void;
  wide?: boolean;
  extraWide?: boolean;
}

export function KeyboardKey({
  label,
  dataKey,
  isPressed,
  onClick,
  wide,
  extraWide,
}: KeyboardKeyProps) {
  return (
    <button
      data-key={dataKey}
      className={cn(
        "inline-flex items-center justify-center h-[44px] rounded-lg bg-[var(--key-bg)] text-[var(--key-text)] text-sm font-semibold cursor-pointer transition-all duration-100 border-none font-inherit select-none",
        "hover:bg-muted",
        isPressed && "bg-[var(--key-active)] text-[var(--key-active-text)] scale-[0.94]",
        wide ? "w-[76px] text-[11px] font-medium uppercase tracking-[0.5px]" : "w-[40px]",
        extraWide && "w-[156px] text-[11px] font-medium uppercase tracking-[0.5px]"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
