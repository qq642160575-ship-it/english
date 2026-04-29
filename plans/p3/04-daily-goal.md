# P3-04: 每日学习目标 (P1)

## 问题

当前 streak 系统只记录"用户今天是否打开了 app"，不记录"用户今天是否真正学了"。这导致两个问题：

1. **不知道"今天够了"**：用户学 2 个词和学 50 个词，系统反馈一样（streak +1）。用户无法判断每天该投入多少。
2. **缺乏目的性**：用户打开 app 后没有明确目标，容易随便点几下就关掉。
3. **burnout 风险**：想进步的热情用户可能一次学太多，第二天就不想碰了。

## 目标

让用户可以设定每日学习目标（新词数 + 复习数），完成后获得明确的成就感反馈，形成可持续的学习节奏。

## 实现方案

### 1. 新增 DailyGoal 类型和存储

在 `src/data/types.ts` 中新增：

```ts
export interface DailyGoal {
  /** 用户设定的每日新词目标数 */
  newWordsPerDay: number;
  /** 用户设定的每日复习目标数 */
  reviewPerDay: number;
  /** 今日已学新词数（每日重置） */
  todayNewCount: number;
  /** 今日已复习数（每日重置） */
  todayReviewCount: number;
  /** 以天为单位的日期字符串，用于判断是否新的一天 */
  date: string; // "2026-04-29" 格式
  /** 是否完成今日目标（前端自动计算） */
}

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
```

### 2. 新增 use-daily-goal hook

新建 `src/hooks/use-daily-goal.ts`：

```ts
import { useState, useCallback, useEffect } from "react";
import type { DailyGoal } from "@/data/types";
import { getTodayStr } from "@/data/types";

const DAILY_GOAL_KEY = "keykey_daily_goal";
const DEFAULT_GOAL: DailyGoal = {
  newWordsPerDay: 10,
  reviewPerDay: 5,
  todayNewCount: 0,
  todayReviewCount: 0,
  date: getTodayStr(),
};

function loadGoal(): DailyGoal {
  if (typeof window === "undefined") return { ...DEFAULT_GOAL };
  try {
    const raw = localStorage.getItem(DAILY_GOAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DailyGoal;
      // 跨天重置
      if (parsed.date !== getTodayStr()) {
        const reset = { ...DEFAULT_GOAL, newWordsPerDay: parsed.newWordsPerDay, reviewPerDay: parsed.reviewPerDay, date: getTodayStr() };
        saveGoal(reset);
        return reset;
      }
      return parsed;
    }
  } catch {}
  return { ...DEFAULT_GOAL };
}

function saveGoal(goal: DailyGoal): void {
  try {
    localStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(goal));
  } catch {}
}

export function useDailyGoal() {
  const [goal, setGoal] = useState<DailyGoal>(loadGoal);

  // 每天首次使用时自动重置
  useEffect(() => {
    if (goal.date !== getTodayStr()) {
      const reset = { ...goal, todayNewCount: 0, todayReviewCount: 0, date: getTodayStr() };
      saveGoal(reset);
      setGoal(reset);
    }
  }, [goal.date]);

  const incrementNew = useCallback(() => {
    setGoal((prev) => {
      const next = { ...prev, todayNewCount: prev.todayNewCount + 1 };
      saveGoal(next);
      return next;
    });
  }, []);

  const incrementReview = useCallback(() => {
    setGoal((prev) => {
      const next = { ...prev, todayReviewCount: prev.todayReviewCount + 1 };
      saveGoal(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((newWordsPerDay: number, reviewPerDay: number) => {
    setGoal((prev) => {
      const next = { ...prev, newWordsPerDay, reviewPerDay };
      saveGoal(next);
      return next;
    });
  }, []);

  const isNewDone = goal.newWordsPerDay <= 0 || goal.todayNewCount >= goal.newWordsPerDay;
  const isReviewDone = goal.reviewPerDay <= 0 || goal.todayReviewCount >= goal.reviewPerDay;
  const isAllDone = isNewDone && isReviewDone;
  const newPercent = goal.newWordsPerDay > 0 ? Math.min((goal.todayNewCount / goal.newWordsPerDay) * 100, 100) : 0;
  const reviewPercent = goal.reviewPerDay > 0 ? Math.min((goal.todayReviewCount / goal.reviewPerDay) * 100, 100) : 0;

  return {
    goal,
    incrementNew,
    incrementReview,
    updateSettings,
    isNewDone,
    isReviewDone,
    isAllDone,
    newPercent,
    reviewPercent,
  };
}
```

### 3. UI：侧边栏显示今日目标进度

修改 `src/components/layout/sidebar.tsx`：

在现有统计区域下方或侧边栏添加进度条：

```tsx
{/* 今日目标 */}
<div className="px-3 py-2">
  <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
    今日目标
  </h4>

  {/* 新词进度 */}
  <div className="mb-1.5">
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-zinc-500 dark:text-zinc-400">新词</span>
      <span className={`font-medium ${goal.isNewDone ? 'text-green-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
        {goal.todayNewCount} / {goal.newWordsPerDay}
        {goal.isNewDone && ' ✓'}
      </span>
    </div>
    <div className="h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-[var(--color-action-blue)] rounded-full transition-all duration-500"
        style={{ width: `${newPercent}%` }}
      />
    </div>
  </div>

  {/* 复习进度 */}
  <div className="mb-1.5">
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-zinc-500 dark:text-zinc-400">复习</span>
      <span className={`font-medium ${goal.isReviewDone ? 'text-green-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
        {goal.todayReviewCount} / {goal.reviewPerDay}
        {goal.isReviewDone && ' ✓'}
      </span>
    </div>
    <div className="h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-500"
        style={{ width: `${reviewPercent}%` }}
      />
    </div>
  </div>

  {/* 全部完成庆祝 */}
  {goal.isAllDone && (
    <div className="mt-2 text-xs text-center text-green-600 dark:text-green-400 font-medium animate-pulse">
      🎉 今日目标已完成！
    </div>
  )}
</div>
```

### 4. 目标设置入口

在侧边栏底部添加齿轮图标，点击弹出设置弹窗：

```tsx
// 简单的设置弹窗（使用现有 Sheet 组件或 dialog）
<button
  onClick={() => setShowGoalSettings(true)}
  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
>
  调整目标
</button>

{showGoalSettings && (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowGoalSettings(false)}>
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-72" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-sm font-semibold mb-4">设置每日目标</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-zinc-500">每日新词数</label>
          <input
            type="number"
            min={1}
            max={50}
            value={goal.newWordsPerDay}
            onChange={(e) => setTempNew(parseInt(e.target.value) || 10)}
            className="w-full mt-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">每日复习数</label>
          <input
            type="number"
            min={0}
            max={50}
            value={goal.reviewPerDay}
            onChange={(e) => setTempReview(parseInt(e.target.value) || 5)}
            className="w-full mt-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          />
        </div>
        <button
          onClick={() => { updateSettings(tempNew, tempReview); setShowGoalSettings(false); }}
          className="w-full py-2 bg-[var(--color-action-blue)] text-white text-sm font-medium rounded-full"
        >
          保存
        </button>
      </div>
    </div>
  </div>
)}
```

### 5. 在完成新词/复习时自动递增计数

在 `src/app/page.tsx` 中：

```tsx
// 在单词正确完成的 useEffect 中
// 如果当前不是复习模式 → incrementNew()
// 如果是复习模式 → incrementReview()
```

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/data/types.ts` | 新增 DailyGoal 接口 + getTodayStr |
| `src/hooks/use-daily-goal.ts` | 新建 |
| `src/components/layout/sidebar.tsx` | 新增目标进度条 + 设置入口 |
| `src/app/page.tsx` | 在单词完成时调用 incrementNew/incrementReview |

### 自测清单

- [ ] 默认每日目标：10 新词 + 5 复习
- [ ] 学完新词后侧边栏进度更新
- [ ] 复习后复习进度更新
- [ ] 跨天自动重置计数
- [ ] 全部完成后显示庆祝信息和动画
- [ ] 目标设置可保存，刷新后不丢失

### 不需要做的

- 不需要复杂的统计图表（已有 history-stats）
- 不需要推送通知
- 不需要与 streak 耦合（各自独立工作）
- 不强制用户必须完成目标（不会 block 使用）
