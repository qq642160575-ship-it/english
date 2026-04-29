"use client";

import { memo } from "react";
import { KeyboardKey } from "./keyboard-key";

interface VirtualKeyboardProps {
  activeKey: string | null;
  onKeyPress: (key: string) => void;
}

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
];

export const VirtualKeyboard = memo(function VirtualKeyboard({ activeKey, onKeyPress }: VirtualKeyboardProps) {
  const isPressed = (k: string) => activeKey === k;

  return (
    <div className="bg-card border border-border rounded-2xl p-[16px_12px_12px] shadow-sm select-none mb-5">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-[5px] mb-[5px]">
          {row.map((k) => (
            <KeyboardKey
              key={k}
              label={k.toUpperCase()}
              dataKey={k}
              isPressed={isPressed(k)}
              onClick={() => onKeyPress(k)}
            />
          ))}
          {ri === 2 && (
            <KeyboardKey
              label="⌫"
              dataKey="backspace"
              isPressed={isPressed("backspace")}
              onClick={() => onKeyPress("backspace")}
              wide
            />
          )}
        </div>
      ))}
      <div className="flex justify-center gap-[5px]">
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
