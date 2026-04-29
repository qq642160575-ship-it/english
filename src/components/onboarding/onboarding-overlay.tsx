"use client";

import { useState } from "react";
import { ONBOARDING_KEY } from "@/lib/constants";
import { Keyboard, Ear, CheckCircle } from "lucide-react";

const slides = [
  {
    title: "边打边学，耳朵先记",
    description: "看到英文单词，把它打出来。每敲一个字母，系统就会读给你听——让耳朵帮你记忆发音。",
    icon: Keyboard,
  },
  {
    title: "即时反馈，立刻知道对错",
    description: "字母变绿色 = 正确\n字母变红色 = 错误\n按退格键（Backspace）可以回退修改。",
    icon: CheckCircle,
  },
  {
    title: "音标同步显示",
    description: "每打一个字母，上方会同步显示当前已打部分的音标。\n慢慢来，重点是听清楚发音。",
    icon: Ear,
  },
];

export function OnboardingOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  const handleComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
    } catch {}
    onDone();
  };

  const slide = slides[step];
  const isLast = step === slides.length - 1;
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl px-8 py-10 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-action-blue)]/10 text-[var(--color-action-blue)] mb-5">
          <Icon className="w-7 h-7" />
        </div>

        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
          {slide.title}
        </h2>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-line leading-relaxed mb-8">
          {slide.description}
        </p>

        {/* 底部圆点指示器 */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-5 bg-[var(--color-action-blue)]"
                  : "w-1.5 bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? handleComplete() : setStep((s) => s + 1))}
          className="w-full py-2.5 bg-[var(--color-action-blue)] text-white text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95"
        >
          {isLast ? "开始学习" : "下一步"}
        </button>
      </div>
    </div>
  );
}

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return true;
  }
}
