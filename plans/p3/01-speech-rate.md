# P3-01: TTS 语速控制 (P0)

## 问题

当前产品核心体验是"边打边听"——用户敲击每个字母时，TTS 立即发音。但浏览器默认的 TTS 语速（rate=1.0）对低水平英语学习者（词汇量 2-3/10）普遍偏快。用户听不清发音，核心学习循环的"听"环节效果打折扣。

- 用户可以反复重听当前词，但语速不变 → 听不清就是听不清，重放 n 次也没用
- 较长的单词（如 "elephant" 3 音节）在默认语速下，用户无法跟音逐字母对应上

## 目标

让用户可以减慢 TTS 朗读速度，确保每个词的发音能清晰分辨。

## 实现方案

### 1. 新增 localStorage 存储键

在 `src/lib/constants.ts` 中添加：

```ts
export const SPEECH_RATE_KEY = "keykey_speech_rate";
export const DEFAULT_SPEECH_RATE = 0.8; // 比默认略慢，适合学习者
```

### 2. 修改 TTS hook

修改 `src/hooks/use-speech.ts`：

```ts
// 新增：读取语速
function getSpeechRate(): number {
  if (typeof window === "undefined") return DEFAULT_SPEECH_RATE;
  try {
    const stored = localStorage.getItem(SPEECH_RATE_KEY);
    if (stored !== null) {
      const rate = parseFloat(stored);
      if (rate >= 0.3 && rate <= 2.0) return rate;
    }
  } catch {}
  return DEFAULT_SPEECH_RATE;
}

// 在 speak() 函数中，设置 utterance.rate
const speak = useCallback((text: string) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = getSpeechRate(); // 使用存储的语速
  // voice 选择逻辑不变...
  window.speechSynthesis.speak(utterance);
}, [/* 不变 */]);
```

### 3. 新增语速选择 UI

修改 `src/components/layout/header.tsx`，在 voice 选择旁边添加语速选择：

```tsx
import { Select } from "@/components/ui/select";
import { SPEECH_RATE_KEY, DEFAULT_SPEECH_RATE } from "@/lib/constants";

// 在 Header 组件内
const [speechRate, setSpeechRate] = useState(() => {
  if (typeof window === "undefined") return DEFAULT_SPEECH_RATE;
  try {
    return parseFloat(localStorage.getItem(SPEECH_RATE_KEY) ?? String(DEFAULT_SPEECH_RATE));
  } catch {
    return DEFAULT_SPEECH_RATE;
  }
});

const handleRateChange = (rate: number) => {
  setSpeechRate(rate);
  try {
    localStorage.setItem(SPEECH_RATE_KEY, String(rate));
  } catch {}
};
```

JSX 添加：
```tsx
<select
  value={speechRate}
  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
  className="text-xs rounded-lg px-2 py-1 bg-white/60 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800"
  aria-label="语速"
>
  <option value={0.5}>0.5x 很慢</option>
  <option value={0.6}>0.6x 慢速</option>
  <option value={0.8}>0.8x 适中</option>
  <option value={1.0}>1.0x 正常</option>
  <option value={1.2}>1.2x 稍快</option>
</select>
```

### 4. 实现说明

- 选择后立即生效，不需要刷新页面
- 使用 `<select>` 而不是滑块，减少实现复杂度
- 当前词重放时使用新语速
- 默认值设为 0.8（比浏览器默认慢）

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/hooks/use-speech.ts` | speak() 中读取 localStorage rate |
| `src/components/layout/header.tsx` | 新增语速选择下拉 |
| `src/lib/constants.ts` | 新增 SPEECH_RATE_KEY 常量 |

### 自测清单

- [ ] 首次进入默认语速为 0.8x
- [ ] 切换语速后立即生效（重新播放当前词）
- [ ] 刷新页面后保留选择的语速
- [ ] 所有语速档位（0.5 / 0.6 / 0.8 / 1.0 / 1.2）均正常工作
- [ ] 快速切换语速不导致崩溃

### 不需要做的

- 不需要动画过渡
- 不需要滑块拖拽（选择已经够用）
- 不需要针对不同语速调整 TTS voice（浏览器自动适配）
