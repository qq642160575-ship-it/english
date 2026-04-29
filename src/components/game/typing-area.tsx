"use client";

import { CharResult } from "@/data/types";
import { cn } from "@/lib/utils";
import { ConfettiBurst } from "./confetti-burst";
import { getWordEmoji, getSentenceEmojis } from "@/data/emoji-map";

type ErrorFlash = "none" | "shake" | "shakeAll";

interface TypingAreaProps {
  target: string;
  input: CharResult[];
  isComplete: boolean;
  showHint: boolean;
  revealedLetters: boolean[];
  errorFlash?: ErrorFlash;
}

export function TypingArea({ target, input, isComplete, showHint, revealedLetters, errorFlash = "none" }: TypingAreaProps) {
  const len = input.length;
  const hasError = input.some((c) => !c.correct);
  const isShaking = errorFlash === "shake" || errorFlash === "shakeAll";
  const isAllRed = errorFlash === "shakeAll";

  const singleEmoji = !target.includes(" ") ? getWordEmoji(target) : null;
  const sentenceEmojis = target.includes(" ") ? getSentenceEmojis(target) : [];

  return (
    <div className="relative flex flex-col items-center justify-center">
      <ConfettiBurst active={isComplete} />

      {/* Emoji display */}
      {singleEmoji && !isComplete && (
        <span className="block text-5xl mb-4 text-center leading-none" role="img" aria-hidden="true">
          {singleEmoji}
        </span>
      )}
      {sentenceEmojis.length > 0 && !isComplete && (
        <div className="flex items-center justify-center gap-2 mb-4 text-2xl leading-none">
          {sentenceEmojis.map((emoji, i) => (
            <span key={i} role="img" aria-hidden="true">{emoji}</span>
          ))}
        </div>
      )}

      <div
        className={cn(
          "flex justify-center gap-1.5 flex-wrap items-center text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight transition-[transform,opacity] duration-500",
          isComplete ? "scale-95 opacity-90" : "scale-100",
          isShaking && "animate-shake",
          errorFlash === "shakeAll" && "animate-shake-strong"
        )}
      >
        {target.split("").map((ch, i) => {
          const isSpace = ch === " ";
          const isTyped = i < len;
          const isCurrent = i === len;
          const isCorrect = isTyped ? input[i].correct : false;

          const isRevealed = !isTyped && !isCurrent && revealedLetters[i];

          let colorClass = isRevealed
            ? "text-zinc-300 dark:text-zinc-600"
            : "text-zinc-200 dark:text-zinc-800/50"; // untyped

          if (isTyped) {
            colorClass = isCorrect
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-red-500 dark:text-red-400";
          } else if (isCurrent) {
            colorClass = "text-zinc-400 dark:text-zinc-600 border-b-4 border-zinc-400 dark:border-zinc-600 -mb-4 pb-3 animate-cursor-blink";
          }

          // Override all to red during shakeAll flash
          if (isAllRed && !isComplete) {
            colorClass = "text-red-500 dark:text-red-400";
          }

          // When hints are off, show underscores for untyped characters (unless revealed)
          const displayChar = !showHint && !isTyped && !isRevealed
            ? (isSpace ? "\u00A0" : "_")
            : (isSpace ? "\u00A0" : ch);

          return (
            <span
              key={i}
              className={cn(
                "transition-colors duration-150 relative",
                isSpace && "w-[16px] md:w-[24px]",
                colorClass,
                !isTyped && !isCurrent && !showHint && "font-black",
                !isTyped && !isCurrent && showHint && "opacity-30",
                isAllRed && "opacity-100"
              )}
            >
              {displayChar}
              {/* Show correct character below when user types wrong */}
              {isTyped && !isCorrect && !isComplete && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-green-500/70 dark:text-green-400/70 font-mono font-normal">
                  {ch === " " ? "␣" : ch}
                </span>
              )}
            </span>
          );
        })}
      </div>

      {isComplete && (
        <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-2 animate-in fade-in zoom-in duration-300">
          <span className="text-2xl md:text-4xl font-black text-green-500 dark:text-green-400 drop-shadow-md">✓</span>
        </div>
      )}

      {/* Shake keyframes */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-5px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
          90% { transform: translateX(2px); }
        }
        @keyframes shake-strong {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-8px); }
          20% { transform: translateX(8px); }
          30% { transform: translateX(-7px); }
          40% { transform: translateX(7px); }
          50% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          70% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          90% { transform: translateX(-2px); }
        }
        .animate-shake {
          animation: shake 0.35s ease-in-out;
        }
        .animate-shake-strong {
          animation: shake-strong 0.5s ease-in-out;
        }
        .animate-cursor-blink {
          animation: cursor-blink 1s step-end infinite;
        }
        @keyframes cursor-blink {
          0%, 50% { border-color: rgb(161 161 170); }
          51%, 100% { border-color: transparent; }
        }
      `}</style>
    </div>
  );
}
