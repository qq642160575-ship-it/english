# P1-1: 复习模式

## 问题

用户学完一个章节后，过几天想复习。如果重新进入该章节，进度是保存的（已完成标记不影响），但没有"快速复习"的方式——用户需要一页页重新看。

## 目标

给已完成章节提供一个"复习模式"，随机抽取章节中的词，让用户快速过一遍，不改变原有进度。

## 实现方案

### Step 1: 在 GameState 中增加复习模式标记

修改 `src/data/types.ts`：

```tsx
export interface GameState {
  // ... 现有字段
  category: string;
  reviewMode: boolean;   // 新增：是否是复习模式
}
```

修改 `use-game-state.ts` 中 `initialState`：

```tsx
const initialState: GameState = {
  // ... 不变
  category: "basic-words",
  reviewMode: false,  // 新增
};
```

### Step 2: 增加 `ENTER_REVIEW` / `EXIT_REVIEW` action

```tsx
type GameAction =
  // ... 现有
  | { type: "ENTER_REVIEW" }
  | { type: "EXIT_REVIEW" };

// Reducer
case "ENTER_REVIEW":
  return { ...state, reviewMode: true, index: 0, input: [], isComplete: false, stats: { letters: 0, correct: 0, errors: 0 }, completedIndices: [] };

case "EXIT_REVIEW":
  return { ...state, reviewMode: false };
```

### Step 3: 在侧边栏/章节导航上添加复习按钮

修改章节指示器部分（page.tsx 约 440-457 行），在已完成的章节按钮上增加"复习"入口。

具体做法：在底部章节按钮区域，已完成章节旁边显示一个小复习按钮。

```tsx
{chapters.map((ch) => {
  const isCompleted = chapterCompleted(ch.chapter); // 需要检查 progress
  return (
    <div key={ch.chapter} className="flex items-center gap-1">
      <button
        onClick={() => handleChapterChange(ch.chapter)}
        className={cn(
          "transition-all rounded-full text-[11px] font-medium active:scale-95",
          ch.chapter === state.chapter
            ? "bg-[var(--color-action-blue)] text-white px-4 py-1.5"
            : "bg-white/60 dark:bg-zinc-900/60 text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-3 py-1.5"
        )}
      >
        {ch.title}
      </button>
      {isCompleted && (
        <button
          onClick={() => handleReview(ch.chapter)}
          className="text-[10px] px-2 py-1 rounded-full text-zinc-400 hover:text-[var(--color-action-blue)] hover:bg-[var(--color-action-blue)]/5 transition-all"
          title="复习"
        >
          复习
        </button>
      )}
    </div>
  );
})}
```

### Step 4: 实现 `handleReview` 函数

```tsx
const handleReview = useCallback((chapter: number) => {
  const items = dataRegistry.getItemsByChapter(state.category, chapter);
  // 打乱顺序
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  setReviewItems(shuffled);
  setIsReviewMode(true);
  loadItem(0, shuffled[0].en);
  cancel();
}, [state.category, loadItem, cancel]);
```

### Step 5: 复习模式下的 auto-advance 行为

与错词复习类似：复习完成后不显示章节完成弹窗，而是显示"复习完成"提示并退出复习模式。

修改 auto-advance useEffect（约 105-117 行）：

```tsx
const timer = setTimeout(() => {
  const s = stateRef.current;
  const items = isReviewMode ? reviewItems : itemsRef.current;
  const nextIndex = s.index + 1;
  if (nextIndex < items.length) {
    loadItem(nextIndex, items[nextIndex].en);
  } else if (isReviewMode) {
    // 复习完成
    setIsReviewMode(false);
    setReviewItems([]);
    // 回到当前章节
    const origItems = loadChapterItems(s.category, s.chapter);
    if (origItems.length > 0) loadItem(0, origItems[0].en);
  }
}, AUTO_ADVANCE_DELAY);
```

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/data/types.ts` | GameState 增加 `reviewMode: boolean` |
| `src/hooks/use-game-state.ts` | 增加 ENTER_REVIEW / EXIT_REVIEW action |
| `src/app/page.tsx` | 增加 review 按钮、handleReview、逻辑分支 |

### 自测清单

- [ ] 已完成章节旁边显示复习按钮
- [ ] 点击复习后，词序打乱
- [ ] 复习模式不保存进度
- [ ] 复习完成后自动退出复习模式
- [ ] 复习期间的统计不计入历史

### 不需要做的

- 不需要复习次数追踪
- 不需要"仅复习错词"（这是 P0-2 的功能）
- 不需要复习进度持久化
