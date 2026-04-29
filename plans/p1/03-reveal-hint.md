# P1-3: 卡住提示（Reveal 功能）

## 问题

初学者词汇量低，看到英文单词不知道如何拼写。当前只有"跳过"按钮，跳过了等于没学到。卡住时用户需要一种"给个小提示"但不直接给答案的机制。

## 目标

当用户卡在某个字母时，按"提示"按钮可以亮出下一个字母的轮廓，帮助用户继续。

## 实现方案

### Step 1: 在 GameState 中增加 revealed 计数

修改 `src/data/types.ts`：

```tsx
export interface GameState {
  // ... 现有
  reviewMode: boolean;
  revealedCount: number;   // 新增：当前词已提示次数
  revealedLetters: boolean[]; // 新增：每个字母是否被提示过
}
```

修改 `use-game-state.ts`：

```tsx
const initialState: GameState = {
  // ... 不变
  reviewMode: false,
  revealedCount: 0,        // 新增
  revealedLetters: [],     // 新增
};
```

### Step 2: 增加 `REVEAL_LETTER` action

```tsx
type GameAction =
  // ... 现有
  | { type: "REVEAL_LETTER"; pos: number };

// Reducer
case "REVEAL_LETTER": {
  if (state.revealedCount >= 2) return state; // 每词最多提示 2 次
  const newRevealed = [...state.revealedLetters];
  newRevealed[action.pos] = true;
  return {
    ...state,
    revealedLetters: newRevealed,
    revealedCount: state.revealedCount + 1,
  };
}
```

在 `LOAD_ITEM` 中重置：

```tsx
case "LOAD_ITEM":
  return {
    ...state,
    index: action.index,
    target: action.target,
    input: [],
    isComplete: false,
    revealedCount: 0,
    revealedLetters: [],
  };
```

### Step 3: 在 TypingArea 中处理 revealed 显示

修改 `src/components/game/typing-area.tsx`，接收 `revealedLetters` prop：

```tsx
interface TypingAreaProps {
  target: string;
  input: CharResult[];
  isComplete: boolean;
  showHint: boolean;
  revealedLetters: boolean[];  // 新增
}
```

对于被 reveal 但还没输入的字母，显示为淡灰色轮廓：

```tsx
{target.split("").map((char, i) => {
  const typed = input[i];
  const isRevealed = revealedLetters[i] && !typed;
  // ...
  if (isRevealed) {
    return (
      <span key={i} className="text-zinc-300 dark:text-zinc-600 text-opacity-50">
        {char}
      </span>
    );
  }
  // ... 其他逻辑
})}
```

### Step 4: 在 Action Buttons 区域添加"提示"按钮

在 page.tsx 中，Action Buttons 区域（约 402-421 行）增加：

```tsx
<AppleActionButton onClick={handleReveal} variant="secondary" disabled={state.revealedCount >= 2 || state.isComplete}>
  <Lightbulb className="w-3.5 h-3.5" />
  提示 ({2 - state.revealedCount})
</AppleActionButton>
```

### Step 5: 实现 `handleReveal`

```tsx
const handleReveal = useCallback(() => {
  const s = stateRef.current;
  // 找到第一个未输入且未提示的字母位置
  for (let i = s.input.length; i < s.target.length; i++) {
    if (!s.revealedLetters[i]) {
      // dispatch REVEAL_LETTER
      // 注意：需要在 useGameState 中暴露 revealLetter action
      game.revealLetter(i);
      break;
    }
  }
}, []);
```

需要在 `use-game-state.ts` 中暴露 `revealLetter`：

```tsx
const revealLetter = useCallback((pos: number) => {
  dispatch({ type: "REVEAL_LETTER", pos });
}, []);
```

### Step 6: 涉及文件

| 文件 | 操作 |
|---|---|
| `src/data/types.ts` | GameState 增加 `revealedCount`, `revealedLetters` |
| `src/hooks/use-game-state.ts` | 增加 REVEAL_LETTER action；LOAD_ITEM 中重置；暴露 revealLetter |
| `src/components/game/typing-area.tsx` | 增加 revealedLetters prop，渲染灰色提示 |
| `src/app/page.tsx` | 增加提示按钮、handleReveal |

### 自测清单

- [ ] 打字区域卡住时，点击提示按钮，下一个字母显示为淡灰色
- [ ] 每词最多提示 2 次（按钮 disable）
- [ ] 提示过的字母仍然需要用户输入
- [ ] 提示不影响正确/错误统计
- [ ] 切换到下一个词后提示计数重置

### 不需要做的

- 不需要语音提示
- 不需要显示中文意思作为 hint（已有翻译）
- 不需要消耗积分/资源
- 不需要"提示过多"的惩罚机制
