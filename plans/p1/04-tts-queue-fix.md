# P1-4: TTS 队列管理修复

## 问题

当前 TTS 存在两个问题：

1. **切换词/句时音频重叠**：用户快速 skip 或 auto-advance 时，旧词的 TTS 没有立即取消，导致新旧音频叠加。
2. **auto-load 和 auto-advance 的音频没有取消前一个**：`useEffect` 在 `state.index` 变化时触发 `speak()`，但取消了之前的 debounce timer，没有调用 `speechSynthesis.cancel()`。

## 目标

确保每次加载新词时立即取消所有正在播放的音频，新音频干净播放。

## 实现方案

### Step 1: 修改 `use-speech.ts`

当前 `speak` 函数已有 `speechSynthesis.cancel()` 调用，但有 100ms debounce。问题是在 debounce 等待期间，如果有新的 `speak` 调用，旧的仍可能触发。

修改方案：增加一个 `force` 参数，在切换词时立即取消 + 无 debounce：

```tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = () => {
      setVoices(
        speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"))
      );
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => {
      speechSynthesis.onvoiceschanged = null;
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    };
  }, []);

  const speak = useCallback(
    (
      text: string,
      options?: {
        rate?: number;
        onend?: () => void;
        immediate?: boolean; // 新增：是否立即播放（跳过 debounce）
      }
    ) => {
      if (!text || typeof speechSynthesis === "undefined") return;

      const doSpeak = () => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = options?.rate ?? 0.75;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        if (selectedVoice) {
          const match = voices.find((v) => v.name === selectedVoice);
          if (match) utterance.voice = match;
        }
        utterance.onerror = (e) => {
          if (e.error !== "canceled") {
            console.warn("TTS error:", e.error);
          }
        };
        if (options?.onend) utterance.onend = options.onend;
        speechSynthesis.speak(utterance);
      };

      if (options?.immediate) {
        // 立即取消旧的 timer + TTS
        if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
        doSpeak();
      } else {
        // 正常 debounce 行为
        if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
        speakTimerRef.current = setTimeout(doSpeak, 100);
      }
    },
    [voices, selectedVoice]
  );

  const cancel = useCallback(() => {
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    speechSynthesis.cancel();
  }, []);

  return { voices, selectedVoice, setSelectedVoice, speak, cancel };
}
```

### Step 2: 修改 page.tsx 中切换词时的音频调用

在 `handleChapterChange` 中已有 `cancel()`，不需要改。

在 auto-advance（onComplete useEffect）中，speak 完整词时增加 `immediate: true`：

```tsx
useEffect(() => {
  if (!state.isComplete || !currentTarget) return;
  if (soundEnabled) speakRef.current(currentTarget, { rate: COMPLETE_RATE, immediate: true });  // 改这里
  // ...
}, [state.isComplete, ...]);
```

在 auto-speak（新词加载时自动朗读）中，也使用 `immediate: true`：

```tsx
useEffect(() => {
  if (!currentTarget || state.isComplete || !soundEnabled) return;
  const timer = setTimeout(
    () => speakRef.current(currentTarget, { immediate: true }),  // 改这里
    INITIAL_SPEAK_DELAY
  );
  return () => {
    clearTimeout(timer);
    // 组件卸载或依赖变化时取消 TTS
    cancelRef.current();
  };
}, [state.index, state.mode, state.category, state.chapter, currentTarget, soundEnabled]);
```

注意：这里需要增加一个 `cancelRef`：

```tsx
const cancelRef = useRef(cancel);
cancelRef.current = cancel;
```

### Step 3: 涉及的修改文件

| 文件 | 操作 |
|---|---|
| `src/hooks/use-speech.ts` | speak 增加 `immediate` 参数 |
| `src/app/page.tsx` | auto-speak 和 auto-advance 使用 `immediate: true` |

### 自测清单

- [ ] 按下 skip 时旧音频立即停止
- [ ] 快速切换章节不会产生音频重叠
- [ ] 正常打字过程中的 TTS debounce 行为不变（非 immediate 场景）
- [ ] 自动朗读新词时不会与之前残留音频重叠

### 不需要做的

- 不需要引入 Web Audio API
- 不需要音频可视化
- 不需要音量滑块（已有开关）
