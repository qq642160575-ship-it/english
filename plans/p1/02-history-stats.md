# P1-2: 历史学习统计

## 问题

当前统计栏只显示当前 session 内的数据（letters / correct / errors / acc / time）。用户关了页面就丢了。无法回答"我昨天学了多少""我进步了没有"这类问题。

## 目标

在 localStorage 中持久化学习历史，提供最近 7 天的学习趋势图。

## 实现方案

### Step 1: 创建 `use-history-stats` hook

`src/hooks/use-history-stats.ts`

```tsx
"use client";

import { useState, useCallback } from "react";

const HISTORY_KEY = "keykey_history";

export interface SessionRecord {
  date: string;         // "2026-04-28"
  mode: "word" | "sentence";
  correct: number;
  errors: number;
  letters: number;
  timeSeconds: number;
  itemsCompleted: number;
}

export interface DailyStats {
  date: string;
  totalCorrect: number;
  totalErrors: number;
  totalLetters: number;
  totalTimeSeconds: number;
  itemsCompleted: number;
  avgAccuracy: number;
}

function loadHistory(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

function saveHistory(records: SessionRecord[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch {}
}

export function useHistoryStats() {
  const [records, setRecords] = useState<SessionRecord[]>(loadHistory);

  const addRecord = useCallback((record: SessionRecord) => {
    setRecords((prev) => {
      const next = [...prev, record];
      // 只保留最近 30 天数据
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const filtered = next.filter((r) => new Date(r.date) >= cutoff);
      saveHistory(filtered);
      return filtered;
    });
  }, []);

  const getDailyStats = useCallback(
    (days: number = 7): DailyStats[] => {
      const result: DailyStats[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayRecords = records.filter((r) => r.date === dateStr);
        const totalCorrect = dayRecords.reduce((s, r) => s + r.correct, 0);
        const totalErrors = dayRecords.reduce((s, r) => s + r.errors, 0);
        const totalLetters = totalCorrect + totalErrors;
        result.push({
          date: dateStr,
          totalCorrect,
          totalErrors,
          totalLetters,
          totalTimeSeconds: dayRecords.reduce((s, r) => s + r.timeSeconds, 0),
          itemsCompleted: dayRecords.reduce((s, r) => s + r.itemsCompleted, 0),
          avgAccuracy: totalLetters > 0 ? totalCorrect / totalLetters : 0,
        });
      }
      return result;
    },
    [records]
  );

  const clearHistory = useCallback(() => {
    setRecords([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return { records, addRecord, getDailyStats, clearHistory };
}
```

### Step 2: 创建统计面板组件

`src/components/stats/stats-panel.tsx`

```tsx
"use client";

import { DailyStats } from "@/hooks/use-history-stats";

export function StatsPanel({
  dailyStats,
  onClose,
}: {
  dailyStats: DailyStats[];
  onClose: () => void;
}) {
  const maxItems = Math.max(...dailyStats.map((d) => d.itemsCompleted), 1);
  const totalItems = dailyStats.reduce((s, d) => s + d.itemsCompleted, 0);
  const avgAcc =
    dailyStats.length > 0
      ? Math.round(
          dailyStats.reduce((s, d) => s + d.avgAccuracy, 0) / dailyStats.length * 100
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
            学习统计
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-sm"
          >
            关闭
          </button>
        </div>

        {/* 汇总 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
              {totalItems}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
              近7天学习词数
            </div>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-success)]">
              {avgAcc}%
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
              平均准确率
            </div>
          </div>
        </div>

        {/* 柱状图 */}
        <div className="mb-2">
          <div className="text-[11px] font-medium text-zinc-400 mb-3">
            每日完成量
          </div>
          <div className="flex items-end justify-between gap-1 h-20">
            {dailyStats.map((day) => {
              const height = maxItems > 0 ? (day.itemsCompleted / maxItems) * 100 : 0;
              const dayLabel = day.date.slice(5); // "04-28"
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-[var(--color-action-blue)]/60 hover:bg-[var(--color-action-blue)] transition-colors"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.date}: ${day.itemsCompleted} items, ${Math.round(day.avgAccuracy * 100)}% acc`}
                  />
                  <span className="text-[8px] text-zinc-400">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 准确率趋势 */}
        <div className="mt-4">
          <div className="text-[11px] font-medium text-zinc-400 mb-3">
            每日准确率
          </div>
          <div className="flex items-end justify-between gap-1 h-16">
            {dailyStats.map((day) => {
              const pct = day.avgAccuracy * 100;
              const color =
                pct >= 90
                  ? "bg-[var(--color-success)]"
                  : pct >= 70
                  ? "bg-amber-400"
                  : "bg-red-400";
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[8px] text-zinc-400">{Math.round(pct)}</span>
                  <div
                    className={`w-full rounded-sm ${color}`}
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 3: 集成到页面中

在 `page.tsx` 中使用：

```tsx
// import
import { useHistoryStats } from "@/hooks/use-history-stats";
import { StatsPanel } from "@/components/stats/stats-panel";

// 在 Home 中
const { addRecord, getDailyStats } = useHistoryStats();
const [showStats, setShowStats] = useState(false);

// 在每次 COMPLETE 后记录（修改 onComplete useEffect）
useEffect(() => {
  if (!state.isComplete || !currentTarget) return;
  // ... 现有逻辑

  // 新增：记录历史（仅在非复习模式）
  if (!isReviewMode) {
    addRecord({
      date: new Date().toISOString().slice(0, 10),
      mode: state.mode,
      correct: state.stats.correct,
      errors: state.stats.errors,
      letters: state.stats.letters,
      timeSeconds: elapsedSeconds,
      itemsCompleted: 1, // 每次完成一个 item 记录一次
    });
  }

  // ... 现有 auto-advance 逻辑
}, [state.isComplete]);
```

在侧边栏底部增加入口：

```tsx
// 在 AppleSidebar 中，theme-toggle 下方增加
<button
  onClick={onShowStats}
  className="w-full flex items-center justify-center py-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 transition-all active:scale-95 gap-2"
>
  <span className="text-xs">📊</span>
  {!collapsed && <span className="text-xs">学习统计</span>}
</button>
```

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/hooks/use-history-stats.ts` | 新建 |
| `src/components/stats/stats-panel.tsx` | 新建 |
| `src/app/page.tsx` | 集成 hook 和面板 |
| `src/components/layout/sidebar.tsx` | 添加统计入口按钮 |

### 自测清单

- [ ] 每次完成一个 item 后，数据被记录到 localStorage
- [ ] 统计面板显示近 7 天的数据
- [ ] 柱状图高度正确反映完成量
- [ ] 准确率图表颜色正确（高/中/低 绿/黄/红）
- [ ] 关闭面板后重新打开数据仍在

### 不需要做的

- 不需要图表库（纯 div + CSS 实现柱状图）
- 不需要跨设备同步
- 不需要周/月筛选器
- 不需要复杂的 WPM 计算
