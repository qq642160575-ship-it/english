"use client";

import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onReset: () => void;
  onListen: () => void;
  onSkip: () => void;
}

export function ActionButtons({ onReset, onListen, onSkip }: ActionButtonsProps) {
  return (
    <div className="flex gap-2 mb-4">
      <Button variant="outline" className="flex-1" onClick={onReset}>
        重置
      </Button>
      <Button variant="outline" className="flex-1" onClick={onListen}>
        听发音
      </Button>
      <Button variant="default" className="flex-1" onClick={onSkip}>
        跳过
      </Button>
    </div>
  );
}
