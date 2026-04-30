"use client";

import { CharResult } from "@/data/types";
import { cn } from "@/lib/utils";
import { ConfettiBurst } from "./confetti-burst";
import { getWordEmoji, getSentenceEmojis } from "@/data/emoji-map";

type ErrorFlash = "none" | "shake";

interface TypingAreaProps {
  target: string;
  input: CharResult[];
  isComplete: boolean;
  showHint: boolean;
  revealedLetters: boolean[];
  errorFlash?: ErrorFlash;
  onEmojiClick?: () => void;
  dictationMode?: boolean;
}

export function TypingArea({ target, input, isComplete, showHint, revealedLetters, errorFlash = "none", onEmojiClick, dictationMode = false }: TypingAreaProps) {
  const len = input.length;
  const isShaking = errorFlash === "shake";

  const singleEmoji = !target.includes(" ") ? getWordEmoji(target) : null;
  const sentenceEmojis = target.includes(" ") ? getSentenceEmojis(target) : [];

  return (
    <div className="relative flex flex-col items-center justify-center">
      <ConfettiBurst active={isComplete} />

      {/* Emoji display */}
      {singleEmoji && !isComplete && (
        <span
          className="block text-5xl mb-4 text-center leading-none cursor-pointer transition-transform hover:scale-110 active:scale-95"
          role="img"
          aria-hidden="true"
          onClick={onEmojiClick}
        >
          {singleEmoji}
        </span>
      )}
      {sentenceEmojis.length > 0 && !isComplete && (
        <div className="flex items-center justify-center gap-2 mb-4 text-2xl leading-none cursor-pointer transition-transform hover:scale-110 active:scale-95" onClick={onEmojiClick}>
          {sentenceEmojis.map((emoji, i) => (
            <span key={i} role="img" aria-hidden="true">{emoji}</span>
          ))}
        </div>
      )}

      <div
        className={cn(
          "flex justify-center gap-1.5 flex-wrap items-center text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight transition-[transform,opacity] duration-500",
          isComplete ? "scale-95 opacity-90" : "scale-100",
          isShaking && "animate-shake"
        )}
      >
        {target.split("").map((ch, i) => {
          const isSpace = ch === " ";
          const isTyped = i < len;
          const isCurrent = i === len;
          const isCorrect = isTyped ? input[i].correct : false;
          const isJustTypedCorrect = isTyped && isCorrect && i === len - 1 && !isComplete;

          // Word grouping for sentence mode
          const isWordBoundary = i > 0 && target[i - 1] === " ";
          const isWordEnd = i >= target.length - 1 || target[i + 1] === " ";
          const isWordJustCompleted = isJustTypedCorrect && isWordEnd;

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

          // Dictation mode: hide untyped characters entirely (no underscores)
          const isHidden = dictationMode && !isTyped && !isRevealed;
          // Spaces show as midpoint dot so user can see them; hide chars when hints off
          const displayChar = isHidden && !isSpace
            ? ""
            : isSpace
              ? "·"
              : (!showHint && !isTyped && !isRevealed ? "_" : ch);

          return (
            <span
              key={i}
              className={cn(
                "transition-colors duration-150 relative",
                isSpace && "w-[12px] md:w-[16px]",
                isWordBoundary && "ml-3 md:ml-4",
                colorClass,
                !isTyped && !isCurrent && !showHint && "font-black",
                !isTyped && !isCurrent && showHint && "opacity-30",
                isJustTypedCorrect && !isWordEnd && "animate-correct-pop",
                isWordJustCompleted && "animate-word-done"
              )}
            >
              {displayChar}
              {/* Show correct character below when user types wrong */}
              {isTyped && !isCorrect && !isComplete && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-green-500/70 dark:text-green-400/70 font-mono font-normal">
                  {isSpace ? "·" : ch}
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
        .animate-shake {
          animation: shake 0.35s ease-in-out;
        }
        .animate-cursor-blink {
          animation: cursor-blink 1s step-end infinite;
        }
        @keyframes cursor-blink {
          0%, 50% { border-color: rgb(161 161 170); }
          51%, 100% { border-color: transparent; }
        }
        .animate-correct-pop {
          animation: correct-pop 0.25s ease-out forwards;
        }
        @keyframes correct-pop {
          0% { transform: scale(1.12); }
          40% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .animate-word-done {
          animation: word-done 0.35s ease-out forwards;
        }
        @keyframes word-done {
          0% { transform: scale(1.15); color: rgb(34 197 94); }
          50% { transform: scale(1.08); color: rgb(34 197 94); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
