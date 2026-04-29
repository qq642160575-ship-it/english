"use client";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline text-sm text-muted-foreground">
        <span>
          <span className="font-bold text-foreground text-xl">{completed}</span>
          <span className="text-muted-foreground"> / {total} 已完成</span>
        </span>
        <span>{percent}%</span>
      </div>
    </div>
  );
}
