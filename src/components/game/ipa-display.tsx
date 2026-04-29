"use client";

import { IpaResult } from "@/hooks/use-ipa-display";

interface IpaDisplayProps {
  result: IpaResult;
  isComplete: boolean;
  inputLength: number;
  fullIpa: string;
}

export function IpaDisplay({ result, isComplete, inputLength, fullIpa }: IpaDisplayProps) {
  if (isComplete) {
    return (
      <div className="text-center mb-6 min-h-[36px]">
        <div className="text-[11px] font-medium tracking-[0.8px] uppercase text-muted-foreground mb-1">
          当前发音
        </div>
        <div className="text-[22px] font-normal font-serif text-[var(--ipa-color)]">
          /{fullIpa}/
        </div>
      </div>
    );
  }

  return (
    <div className="text-center mb-6 min-h-[36px]">
      <div className="text-[11px] font-medium tracking-[0.8px] uppercase text-muted-foreground mb-1">
        当前发音
      </div>
      <div className="text-[22px] font-normal font-serif">
        {inputLength === 0 ? (
          <span className="text-muted-foreground text-base font-sans">
            输入字母查看音标
          </span>
        ) : result.ipa ? (
          <>
            <span className="font-medium text-foreground">&quot;{result.typed}&quot;</span>
            <span className="text-muted-foreground mx-2 font-light">→</span>
            <span className="text-[var(--ipa-color)]">/{result.ipa}/</span>
          </>
        ) : (
          <span className="text-muted-foreground text-base font-sans">—</span>
        )}
      </div>
    </div>
  );
}
