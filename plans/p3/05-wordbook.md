# P3-05: 生词本 / 单词收藏 (P1)

## 问题

当前用户遇到"重要但一时记不住"的单词时，没有任何保存方式：

1. 学完 chapter 2 后，chapter 1 的错词需要重新进入章节才能复习
2. 在"colors"词包里遇到的难词，切换到"animals"后就再也找不到了
3. 用户在浏览 / 试学的过程中遇到有价值的词，无法"标记收藏"
4. 错词复习仅在当前 session 有效，关闭页面后错词记录丢失

对于学习工具，"标记难词反复看"是最基本的功能之一。没有它，用户的学习是"随缘"的。

## 目标

让用户可以随时收藏任何单词，并在生词本中集中复习所有收藏的单词。

## 实现方案

### 1. 新增 WordBook 数据和 Hook

新建 `src/hooks/use-wordbook.ts`：

```ts
import { useState, useCallback } from "react";

export interface WordBookEntry {
  en: string;
  zh: string;
  ipa?: string;
  packId: string;
  addedAt: number;
}

const WORDBOOK_KEY = "keykey_wordbook";

function loadWordbook(): WordBookEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WORDBOOK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveWordbook(entries: WordBookEntry[]): void {
  try {
    localStorage.setItem(WORDBOOK_KEY, JSON.stringify(entries));
  } catch {}
}

export function useWordbook() {
  const [entries, setEntries] = useState<WordBookEntry[]>(loadWordbook);

  const addEntry = useCallback((entry: WordBookEntry) => {
    setEntries((prev) => {
      // 去重：同一个 en 不重复添加
      if (prev.some((e) => e.en === entry.en)) return prev;
      const next = [entry, ...prev];
      saveWordbook(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((en: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.en !== en);
      saveWordbook(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback(
    (en: string) => entries.some((e) => e.en === en),
    [entries]
  );

  const toggleEntry = useCallback(
    (entry: WordBookEntry) => {
      if (entries.some((e) => e.en === entry.en)) {
        removeEntry(entry.en);
      } else {
        addEntry(entry);
      }
    },
    [entries, addEntry, removeEntry]
  );

  return {
    entries,
    addEntry,
    removeEntry,
    isBookmarked,
    toggleEntry,
    count: entries.length,
  };
}
```

### 2. 收藏按钮 UI

修改 `src/components/game/target-display.tsx`：

在翻译旁边或单词右上角添加一个星形收藏按钮：

```tsx
// 引入 wordbook hook（通过 props 传入或 context）
// 在单词显示区域添加
<button
  onClick={() => onToggleBookmark({
    en: word,
    zh: translation,
    ipa: currentIpa,
    packId: currentPack,
    addedAt: Date.now(),
  })}
  className={`text-lg transition-all active:scale-90 ${
    isBookmarked
      ? "text-amber-400"
      : "text-zinc-300 dark:text-zinc-600 hover:text-amber-300"
  }`}
  title={isBookmarked ? "取消收藏" : "收藏到生词本"}
>
  {isBookmarked ? "★" : "☆"}
</button>
```

样式建议：
- 未收藏状态：浅灰色 ☆，hover 变黄色
- 已收藏状态：亮黄色 ★，带轻微动画

### 3. 侧边栏生词本入口

修改 `src/components/layout/sidebar.tsx`：

在单词选择区域添加生词本入口：

```tsx
{count > 0 && (
  <button
    onClick={handleOpenWordbook}
    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
      text-zinc-600 dark:text-zinc-300
      hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
  >
    <span className="text-amber-400">📖</span>
    <span>生词本</span>
    <span className="ml-auto text-[10px] text-zinc-400">{count} 词</span>
  </button>
)}
```

### 4. 生词本复习模式

点击生词本入口后，复用现有复习模式逻辑展示收藏列表：

- 使用现有 `reviewMode` 机制（已有 shuffle 和进度跟踪）
- 每个词旁边可以点击"取消收藏"
- 复习完成后不改变 SRS 状态（由 SRS 系统管理长期记忆）

修改 `src/app/page.tsx`，增加 `handleWordbookReview`：

```tsx
const handleWordbookReview = useCallback(() => {
  if (wordbookEntries.length === 0) return;
  const shuffled = [...wordbookEntries].sort(() => Math.random() - 0.5);
  setReviewItems(shuffled.map((e) => ({ en: e.en, zh: e.zh })));
  setIsReviewMode(true);
  loadItem(0, shuffled[0].en);
  cancel();
}, [wordbookEntries, loadItem, cancel]);
```

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/hooks/use-wordbook.ts` | 新建 |
| `src/components/game/target-display.tsx` | 新增收藏按钮 |
| `src/components/layout/sidebar.tsx` | 新增生词本入口 |
| `src/app/page.tsx` | 生词本复习模式逻辑 |

### 自测清单

- [ ] 每个单词右上角显示收藏按钮
- [ ] 点击 ☆ 变为 ★，切换章节/刷新后状态保持
- [ ] 再次点击 ★ 取消收藏变回 ☆
- [ ] 侧边栏显示生词本计数
- [ ] 点击生词本进入复习模式，单词随机排列
- [ ] 生词本复习中可取消收藏
- [ ] 同一个英文单词不可重复添加生词本

### 不需要做的

- 不需要文件夹/标签分类
- 不需要笔记/批注功能
- 不需要导出生词本（可复用 data-io.ts 的导出功能）
- 不需要排序/筛选（按添加顺序倒序即可）
