# P0-2: 错词强化（Error Word Review）

## 问题

用户打字出错后（字母变红），用户修正后继续，但这个词就过去了。下次再遇到同样的词，用户可能还是不会。没有"从错误中学习"的闭环。

## 目标

在一个练习轮次中，如果某个单词用户打错过，在章节完成后提供"复习错词"功能，让用户针对自己的薄弱点强化练习。

## 实现方案

### Step 1: 在 GameState 中增加错词追踪

修改 `src/data/types.ts`，在 `GameState` 中增加字段：

```tsx
export interface GameState {
  // ... 现有字段不变
  category: string;
  // 新增以下字段
  wrongWords: Set<number>;   // 出错的 item index 集合（用 Array 序列化）
}
```

由于 `Set` 不能直接序列化，实际上在 reducer 中用 `number[]` 存储：

```tsx
// GameState 中
wrongIndices: number[];  // 替换 wrongWords
```

同步修改 `initialState`：

```tsx
const initialState: GameState = {
  // ... 不变
  category: "basic-words",
  wrongIndices: [],  // 新增
};
```

### Step 2: 在 CHAR_INPUT 中记录错误

修改 `src/hooks/use-game-state.ts` 中的 `gameReducer`：

```tsx
case "CHAR_INPUT": {
  if (state.isComplete) return state;
  const pos = state.input.length;
  if (pos >= state.target.length) return state;
  const ch = action.char;
  const targetChar = state.target[pos].toLowerCase();
  const correct = ch === targetChar;

  // 判断是否因为这次输入导致整个词有错误
  const hadError = !correct;

  return {
    ...state,
    input: [...state.input, { char: ch, correct }],
    wrongIndices: hadError
      ? state.wrongIndices.includes(state.index)
        ? state.wrongIndices
        : [...state.wrongIndices, state.index]
      : state.wrongIndices,
    stats: {
      letters: state.stats.letters + 1,
      correct: state.stats.correct + (correct ? 1 : 0),
      errors: state.stats.errors + (correct ? 0 : 1),
    },
  };
}
```

注意：这里只在"第一次出错"时记录（避免重复添加同一个 index）。

在 `COMPLETE_ITEM`、`RESET`、`SET_MODE` 等 action 中重置 `wrongIndices`：

```tsx
case "COMPLETE_ITEM": {
  const newCompleted = Array.from(new Set([...state.completedIndices, state.index]));
  return { ...state, isComplete: true, completedIndices: newCompleted };
  // wrongIndices 保持不变——跨 item 累积
}
```

### Step 3: 在章节完成弹窗中添加"复习错词"按钮

修改 `page.tsx` 中的章节完成弹窗部分（约 459-484 行）：

```tsx
{isChapterComplete && (
  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm">
    <div className="bg-white dark:bg-zinc-900 rounded-2xl px-10 py-10 text-center max-w-sm animate-in fade-in zoom-in-95 duration-300">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] text-2xl">✓</div>
      </div>
      <h2 className="text-xl font-[var(--font-display)] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1">
        章节完成
      </h2>
      <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-6">
        {chapters.find((c) => c.chapter === state.chapter)?.title}
      </p>

      {/* 错词复习提示 */}
      {state.wrongIndices.length > 0 && (
        <div className="mb-6 text-sm">
          <p className="text-zinc-500 mb-2">
            有 <span className="text-amber-500 font-semibold">{state.wrongIndices.length}</span> 个词出过错
          </p>
          <button
            onClick={handleReviewWrongWords}
            className="w-full px-5 py-2 bg-amber-500 text-white text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95"
          >
            复习错词 ({state.wrongIndices.length})
          </button>
        </div>
      )}

      <div className="flex gap-2.5 justify-center">
        <button onClick={handleReset} className="px-5 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95">
          重新练习
        </button>
        {chapters.findIndex((c) => c.chapter === state.chapter) < chapters.length - 1 && (
          <button onClick={() => handleChapterChange(state.chapter + 1)} className="px-5 py-2 bg-[var(--color-action-blue)] text-white text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95">
            下一章
          </button>
        )}
      </div>
    </div>
  </div>
)}
```

### Step 4: 实现 `handleReviewWrongWords`

在 page.tsx 中新增函数（约 215 行附近）：

```tsx
const [isReviewMode, setIsReviewMode] = useState(false);
const [reviewItems, setReviewItems] = useState<(WordItem | SentenceItem)[]>([]);

const handleReviewWrongWords = useCallback(() => {
  const wrongItems = state.wrongIndices
    .map((i) => categoryItems[i])
    .filter(Boolean);
  if (wrongItems.length === 0) return;
  setIsReviewMode(true);
  setReviewItems(wrongItems);
  // 替换当前词列表为错词列表
  // load 第一个错词
  loadItem(0, wrongItems[0].en);
  cancel();
}, [state.wrongIndices, categoryItems, loadItem, cancel]);
```

在 loadChapterItems 之外的逻辑中处理 review mode：

在 page.tsx 的 `loadChapterItems` 函数保持不变；在 auto-advance 的逻辑中处理 review mode：

```tsx
// 修改 auto-advance 的 useEffect（约 105-117 行）
useEffect(() => {
  if (!state.isComplete || !currentTarget) return;
  if (soundEnabled) speakRef.current(currentTarget, { rate: COMPLETE_RATE });
  save(stateRef.current);
  const timer = setTimeout(() => {
    const s = stateRef.current;
    const items = isReviewMode ? reviewItems : itemsRef.current;
    const nextIndex = s.index + 1;
    if (nextIndex < items.length) {
      loadItem(nextIndex, items[nextIndex].en);
    } else if (isReviewMode) {
      // 复习完成，回到正常模式
      setIsReviewMode(false);
      setReviewItems([]);
      // 重新加载原章节
      const origItems = loadChapterItems(s.category, s.chapter);
      if (origItems.length > 0) loadItem(0, origItems[0].en);
      // 清空错词记录
      // 注意：需要 dispatch 一个 CLEAR_WRONG  action
    }
  }, AUTO_ADVANCE_DELAY);
  return () => clearTimeout(timer);
}, [state.isComplete, currentTarget, soundEnabled, save, isReviewMode, reviewItems]);
```

### Step 5: 增加 `CLEAR_WRONG` action

在 `use-game-state.ts` 的 action 类型和 reducer 中增加：

```tsx
type GameAction =
  // ... 现有类型
  | { type: "CLEAR_WRONG" };

// reducer 中
case "CLEAR_WRONG":
  return { ...state, wrongIndices: [] };
```

### Step 6: 涉及的修改文件

| 文件 | 操作 |
|---|---|
| `src/data/types.ts` | GameState 增加 `wrongIndices: number[]` |
| `src/hooks/use-game-state.ts` | CHAR_INPUT 中记录错误；增加 CLEAR_WRONG action |
| `src/app/page.tsx` | 增加 review 状态、handleReviewWrongWords、修改弹窗和 auto-advance |

### 自测清单

- [ ] 正常输入不出现错误的词，完成后弹窗不显示错词复习
- [ ] 输入中出现过错误的词，完成后弹窗显示"复习错词 (N个)"
- [ ] 点击复习错词后，只加载出错的词
- [ ] 复习轮次全部完成后，回到正常章节
- [ ] 切换章节/模式时错词记录重置

### 不需要做的

- 不需要跨 session 持久化错词（后续可升级）
- 不需要分析错误模式（如特定字母总打错）
- 不需要动画
