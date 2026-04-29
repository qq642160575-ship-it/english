# P0-1: 新手引导 Onboarding

## 问题

用户首次打开页面，看到的是一块打字区域、IPA 音标、虚拟键盘、统计数据等大量陌生元素。这个产品的核心创新是"type and hear"打字听音学习法，但这不是自解释的。用户可能在 30 秒内关闭页面。

## 目标

让首次使用的用户在 3 屏内理解：
1. 这个产品是干什么的
2. 怎么操作
3. 绿色/红色分别代表什么

## 实现方案

### 1. 新建组件文件

`src/components/onboarding/onboarding-overlay.tsx`

```tsx
"use client";

import { useState } from "react";

const ONBOARDING_KEY = "keykey_onboarding_done";

const slides = [
  {
    title: "边打边学，耳朵先记",
    description: "看到英文单词，把它打出来。每敲一个字母，系统就会读给你听——让耳朵帮你记忆发音。",
    icon: "⌨️",
  },
  {
    title: "即时反馈，立刻知道对错",
    description: "字母变绿色 = 正确 ✅\n字母变红色 = 错误 ❌\n按退格键（Backspace）可以回退修改。",
    icon: "✅",
  },
  {
    title: "音标同步显示",
    description: "每打一个字母，上方会同步显示当前已打部分的音标。\n慢慢来，重点是听清楚发音。",
    icon: "🔊",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl px-8 py-10 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-4xl mb-4">{slide.icon}</div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          {slide.title}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-line leading-relaxed mb-6">
          {slide.description}
        </p>

        {/* 底部圆点指示器 */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === step
                  ? "bg-[var(--color-action-blue)] w-4"
                  : "bg-zinc-300 dark:bg-zinc-700"
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

// 用于检查是否已完成引导的辅助函数
export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return true;
  }
}
```

### 2. 修改 `src/app/page.tsx`

在 `Home` 组件中添加状态：

```tsx
// 新增 import
import { OnboardingOverlay, isOnboardingDone } from "@/components/onboarding/onboarding-overlay";

// 在 Home 组件内新增状态（~35行附近）
const [showOnboarding, setShowOnboarding] = useState(!isOnboardingDone());
```

在 return 中、`<AppleSidebar>` 之前添加：

```tsx
{showOnboarding && (
  <OnboardingOverlay onDone={() => setShowOnboarding(false)} />
)}
```

### 3. 涉及的修改文件

| 文件 | 操作 |
|---|---|
| `src/components/onboarding/onboarding-overlay.tsx` | 新建 |
| `src/app/page.tsx` | 添加状态 + 条件渲染 |
| `src/lib/constants.ts` | 可选：添加 `ONBOARDING_KEY` 常量 |

### 4. 自测清单

- [ ] 首次访问显示引导弹窗
- [ ] 3 屏可以正常切换
- [ ] 在最后一屏点击"开始学习"后关闭，不再显示
- [ ] 刷新页面后不再弹出
- [ ] 暗色模式下显示正常

### 5. 不需要做的

- 不需要动画库，纯 CSS transition
- 不需要多语言（目标用户是中文用户）
- 不需要跳过按钮（3 屏看完不到 15 秒）
- 不需要底部的"跳过引导"链接（太短不值得）
