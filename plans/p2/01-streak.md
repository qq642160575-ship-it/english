# P2-1: 签到打卡（Streak）

## 问题

用户没有"明天再来"的理由。学习类产品的留存核心是习惯养成，而习惯养成需要外部动力。

## 目标

用简单的连续签到机制，给用户一个每天回来练习的理由。

## 实现方案

### Step 1: 修改 `use-history-stats.ts`

在其基础上增加 streak 逻辑：

```tsx
const STREAK_KEY = "keykey_streak";

export interface StreakData {
  lastActiveDate: string;   // "2026-04-28"
  currentStreak: number;    // 连续天数
  longestStreak: number;    // 历史最长
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>(() => {
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { lastActiveDate: "", currentStreak: 0, longestStreak: 0 };
  });

  const markActive = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setStreak((prev) => {
      if (prev.lastActiveDate === today) return prev; // 今天已经打卡过了

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      const newStreak = prev.lastActiveDate === yesterdayStr
        ? prev.currentStreak + 1
        : 1; // 断了或第一次

      const newData: StreakData = {
        lastActiveDate: today,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
      };

      try {
        localStorage.setItem(STREAK_KEY, JSON.stringify(newData));
      } catch {}

      return newData;
    });
  }, []);

  return { streak, markActive };
}
```

### Step 2: 在每完成一个 item 时打卡

在 page.tsx 的 item complete useEffect 中调用 `markActive()`：

```tsx
const { streak, markActive } = useStreak();

// 在完成 item 时：
if (!isReviewMode) {
  markActive();
  addRecord({...});
}
```

### Step 3: 在侧边栏显示连续打卡信息

在 `AppleSidebar` 底部增加：

```tsx
{!collapsed && (
  <div className="px-3 py-2 border-t border-zinc-200/30 dark:border-zinc-800/30">
    <div className="flex items-center gap-2 text-xs">
      <span className="text-amber-500">🔥</span>
      <span className="text-zinc-500 dark:text-zinc-400">
        连续学习 <strong className="text-zinc-800 dark:text-zinc-200">{streak.currentStreak}</strong> 天
      </span>
    </div>
  </div>
)}
```

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/hooks/use-history-stats.ts` | 增加 `useStreak` hook |
| `src/app/page.tsx` | 集成 markActive |
| `src/components/layout/sidebar.tsx` | 显示 streak 信息 |

### 自测清单

- [ ] 完成一个 item 后，打卡天数 +1
- [ ] 同一天多次练习不重复计数
- [ ] 隔天回来打卡，连续天数 +1
- [ ] 跳过一天，连续天数重置为 1
- [ ] 最长连续天数正确记录

### 不需要做的

- 不需要推送通知
- 不需要社交排行榜
- 不需要奖励/徽章系统
