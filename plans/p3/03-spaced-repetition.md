# P3-03: 间隔复习系统 - Spaced Repetition (P0)

## 问题

当前产品的学习流程是：学单词 → 完成章节 → 可立即复习（复习模式+错词复习）。但**没有长期记忆机制**。

用户学习路径：
- 第 1 天：学完 "animals" 第 1 章（10 个词），正确率 90%
- 第 2 天：学 "animals" 第 2 章（10 个新词），第 1 章的词开始遗忘
- 第 7 天：学完所有 animals 词包 → 第 1 章的词已忘记大半

问题本质：**学了不等于记住了**。没有间隔复习，投入的时间无法转化为长期记忆。产品的核心价值——"帮用户真正学会英语发音"——就无法达成。

## 目标

建立一个自动化的间隔复习系统，让学过的单词在遗忘曲线临界点被自动召回。

## 实现方案

### 1. 新增 SRS 数据类型

在 `src/data/types.ts` 中新增：

```ts
export interface SRSItem {
  /** 唯一标识: "词包ID/章节号/索引" */
  id: string;
  /** 英文单词 */
  en: string;
  /** 中文释义 */
  zh: string;
  /** 所属词包 */
  packId: string;
  /** 当前 SRS 阶段: 0=刚学完, 1=第一轮复习, 2=第二轮, 3=已掌握 */
  stage: number;
  /** 上次复习时间戳 */
  lastReviewed: number;
  /** 下次应复习的时间戳 */
  nextReview: number;
  /** 连续正确次数 */
  correctStreak: number;
}

export interface SRSData {
  items: Record<string, SRSItem>;
  updatedAt: number;
}
```

### 2. 新增 SRS hook

新建 `src/hooks/use-srs.ts`：

```ts
import { useCallback, useMemo } from "react";
import type { SRSItem, SRSData } from "@/data/types";

const SRS_KEY = "keykey_srs_v1";

// 间隔算法：每轮间隔递增
const INTERVALS_MS = [
  0,                    // stage 0: 刚学完，不需要复习
  24 * 60 * 60 * 1000,  // stage 1: 1 天后
  3 * 24 * 60 * 60 * 1000, // stage 2: 3 天后
  7 * 24 * 60 * 60 * 1000, // stage 3: 7 天后
];

function loadSRS(): SRSData {
  if (typeof window === "undefined") return { items: {}, updatedAt: Date.now() };
  try {
    const raw = localStorage.getItem(SRS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { items: {}, updatedAt: Date.now() };
}

function saveSRS(data: SRSData): void {
  try {
    data.updatedAt = Date.now();
    localStorage.setItem(SRS_KEY, JSON.stringify(data));
  } catch {}
}

export function useSRS() {
  const [srsData, setSrsData] = useState<SRSData>(loadSRS);

  // 待复习的单词（到时间的）
  const dueItems = useMemo(() => {
    const now = Date.now();
    return Object.values(srsData.items)
      .filter((item) => item.nextReview <= now && item.stage > 0 && item.stage < 3)
      .sort((a, b) => a.nextReview - b.nextReview);
  }, [srsData]);

  // 新增一个词进入 SRS
  const addItem = useCallback((en: string, zh: string, packId: string, id: string) => {
    setSrsData((prev) => {
      if (prev.items[id]) return prev; // 已存在不重复添加
      const newItem: SRSItem = {
        id,
        en,
        zh,
        packId,
        stage: 0,
        lastReviewed: Date.now(),
        nextReview: Date.now(), // 立即可以复习（第一次）
        correctStreak: 0,
      };
      const next = { ...prev, items: { ...prev.items, [id]: newItem } };
      saveSRS(next);
      return next;
    });
  }, []);

  // 回答正确：升级
  const answerCorrect = useCallback((id: string) => {
    setSrsData((prev) => {
      const item = prev.items[id];
      if (!item) return prev;
      const nextStage = Math.min(item.stage + 1, 3);
      const updated: SRSItem = {
        ...item,
        stage: nextStage,
        correctStreak: item.correctStreak + 1,
        lastReviewed: Date.now(),
        nextReview: Date.now() + INTERVALS_MS[nextStage],
      };
      const next = { ...prev, items: { ...prev.items, [id]: updated } };
      saveSRS(next);
      return next;
    });
  }, []);

  // 回答错误：降级
  const answerWrong = useCallback((id: string) => {
    setSrsData((prev) => {
      const item = prev.items[id];
      if (!item) return prev;
      const updated: SRSItem = {
        ...item,
        stage: Math.max(item.stage - 1, 0),
        correctStreak: 0,
        lastReviewed: Date.now(),
        nextReview: Date.now() + INTERVALS_MS[Math.max(item.stage - 1, 0)],
      };
      const next = { ...prev, items: { ...prev.items, [id]: updated } };
      saveSRS(next);
      return next;
    });
  }, []);

  // 获取今天应复习总数
  const dueCount = dueItems.length;

  return {
    addItem,
    answerCorrect,
    answerWrong,
    dueItems,
    dueCount,
    totalItems: Object.keys(srsData.items).length,
  };
}
```

### 3. 自动添加学过的单词到 SRS

修改 `src/app/page.tsx`：当一个单词被完成（输入正确达到完整长度）时，自动调用 `addItem()`。

```tsx
// 在 auto-advance 或单词完成逻辑中
// 找到某种方式注册 SRS
```

具体插入点：在 `page.tsx` 中完成一个单词检测的位置（通常是在 useEffect 中检测 `state.isComplete` 为 true 时）调用 `addItem`。

### 4. 侧边栏添加 SRS 入口

修改 `src/components/layout/sidebar.tsx`：

在侧边栏底部或现有 StatItem 区域添加待复习指示：

```tsx
{dueCount > 0 && (
  <button
    onClick={handleSRSReview}
    className="w-full flex items-center justify-between px-3 py-2 rounded-lg
      bg-amber-50 dark:bg-amber-900/20
      text-amber-700 dark:text-amber-400
      text-xs font-medium
      hover:bg-amber-100 dark:hover:bg-amber-900/30
      transition-all active:scale-[0.98]"
  >
    <span>📝 待复习单词</span>
    <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
      {dueCount > 99 ? "99+" : dueCount}
    </span>
  </button>
)}
```

点击后进入 SRS 复习模式：复用现有复习模式逻辑，遍历 `dueItems` 列表。

### 5. SRS 复习模式

复用 `reviewMode` 逻辑（已在 P1-01 review-mode.md 中实现）。新增一个 `srsReview` 模式变体：

- 从 `dueItems` 中顺序展示单词
- 每个单词完成后按钮：✅ 记住了（→ `answerCorrect`）/ ❌ 再想想（→ `answerWrong`）
- 复习完成后显示"今日复习完成！"提示
- 复习期间统计不计入日常目标

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/data/types.ts` | 新增 SRSItem, SRSData 接口 |
| `src/hooks/use-srs.ts` | 新建 |
| `src/app/page.tsx` | 完成单词时调用 addItem + SRS复习模式入口 |
| `src/components/layout/sidebar.tsx` | 新增待复习 badge 和入口 |

### 自测清单

- [ ] 学完一个单词后，自动进入 SRS 系统
- [ ] 1 天后侧边栏显示待复习数量
- [ ] 点击待复习入口进入 SRS 复习模式
- [ ] 答对升级，答错降级
- [ ] stage 3（已掌握）的单词不再出现
- [ ] 刷新页面后 SRS 数据不丢失

### 不需要做的

- 不需要 SM-2 等复杂算法（简单的 1-3-7 天递增即可）
- 不需要推送通知（浏览器限制且复杂性高）
- 不需要复习日历/热力图（当前已有 streak）
- 不需要针对"已掌握"单词的再复习（用户可手动重置）
