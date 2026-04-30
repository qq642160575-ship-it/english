"use client";

import { memo } from "react";
import { KeyboardKey } from "./keyboard-key";
import { CharResult } from "@/data/types";
import { cn } from "@/lib/utils";

interface VirtualKeyboardProps {
  activeKey: string | null;
  onKeyPress: (key: string) => void;
  input?: CharResult[];
  isComplete?: boolean;
}

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

export const VirtualKeyboard = memo(function VirtualKeyboard({ activeKey, onKeyPress, input, isComplete }: VirtualKeyboardProps) {
  const isPressed = (k: string) => activeKey === k;

  // Compute key status from input
  const keyStatus = new Map<string, "correct" | "wrong">();
  if (input) {
    for (const ch of input) {
      const char = ch.char.toLowerCase();
      if (!keyStatus.has(char) || ch.correct) {
        keyStatus.set(char, ch.correct ? "correct" : "wrong");
      }
    }
  }

  return (
    <div className={cn(
      "bg-card/80 dark:bg-card/90 border border-border/80 rounded-2xl p-[16px_12px_12px] shadow-sm select-none mb-5",
      "transition-all duration-300 ease-out backdrop-blur-[1px]",
      isComplete && "opacity-30 scale-[0.97] pointer-events-none"
    )}>
      {ROWS.map((row, ri) => (
        <div
          key={ri}
          className="flex justify-center gap-[5px] mb-[5px] animate-stagger-in"
          style={{ animationDelay: `${ri * 60}ms` }}
        >
          {row.map((k) => (
            <KeyboardKey
              key={k}
              label={k}
              dataKey={k}
              isPressed={isPressed(k)}
              status={keyStatus.get(k)}
              onClick={() => onKeyPress(k)}
            />
          ))}
          {ri === 2 && (
            <KeyboardKey
              label="← 退格"
              dataKey="backspace"
              isPressed={isPressed("backspace")}
              onClick={() => onKeyPress("backspace")}
              wide
            />
          )}
        </div>
      ))}
      <div className="flex justify-center gap-[5px] translate-y-[1px]">
        <KeyboardKey
          label="空格"
          dataKey="space"
          isPressed={isPressed("space")}
          onClick={() => onKeyPress("space")}
          extraWide
        />
      </div>
    </div>
  );
});
