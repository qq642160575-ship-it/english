"use client";

interface TargetDisplayProps {
  en: string;
  zh: string;
}

export function TargetDisplay({ en, zh }: TargetDisplayProps) {
  return (
    <div className="text-center mb-2">
      <div className="text-[56px] font-bold tracking-[1px] leading-[1.2] text-foreground max-md:text-[40px]">
        {en}
      </div>
      <div className="text-base text-muted-foreground mt-1">{zh}</div>
    </div>
  );
}
