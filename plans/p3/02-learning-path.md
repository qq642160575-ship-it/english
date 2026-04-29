# P3-02: 学习路径系统 (P0)

## 问题

当前所有 6 个词包都是 difficulty 1，没有难度渐进。用户首次打开 app 后，侧边栏显示 6 个词包和 1 个句子包，但没有"该先学哪个"的指引。

用户旅程现状：
1. 打开 app → 看到词包列表 → 不知道先学哪个
2. 随便选一个（如 animals）→ 完成 → 回到列表 → 又面临选择
3. 每次打开 app 都需要决策 → **决策疲劳导致放弃**

对于低水平学习者，"告诉我该学什么"比"让自己选"更重要。

## 目标

- 给用户一条从易到难的清晰学习路径
- 完成一个词包后自动推荐下一个
- 让用户感知到自己的学习进度和进阶过程

## 实现方案

### 1. 为词包增加排序和难度元数据（不破坏现有格式）

不修改词包 JSON 文件。在 `src/data/registry.ts` 或 `src/data/types.ts` 中新增一个学习路径映射：

```ts
// src/data/constants.ts 或 registry.ts
export const LEARNING_PATH: { packId: string; order: number; name: string; description: string }[] = [
  { packId: "basic-words",   order: 1, name: "基础入门",    description: "最常用的基础单词" },
  { packId: "colors",        order: 2, name: "颜色形状",    description: "颜色和形状" },
  { packId: "animals",       order: 3, name: "动物王国",    description: "常见动物名称" },
  { packId: "daily",         order: 4, name: "日常生活",    description: "家居日常用品" },
  { packId: "food",          order: 5, name: "美食天地",    description: "食物和饮料" },
  { packId: "body",          order: 6, name: "身体部位",    description: "人体各部位" },
];
```

### 2. 新增 use-learning-path hook

新建 `src/hooks/use-learning-path.ts`：

```ts
import { useMemo } from "react";
import { LEARNING_PATH } from "@/lib/constants";
import type { DataRegistry } from "@/data/registry";

export function useLearningPath(
  registry: DataRegistry,
  progress: Record<string, any> // 用户的进度数据
) {
  return useMemo(() => {
    const path = LEARNING_PATH.map((entry) => {
      const packProgress = progress[entry.packId];
      const total = registry.getPackItemCount(entry.packId);
      const completed = packProgress?.completedIndices?.length ?? 0;
      const allDone = completed >= total;

      return {
        ...entry,
        total,
        completed,
        allDone,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    // 推荐下一个未完成的词包
    const next = path.find((p) => !p.allDone);

    return {
      path,
      nextPack: next,
      allPacksDone: !next,
      totalProgress: {
        completed: path.reduce((sum, p) => sum + p.completed, 0),
        total: path.reduce((sum, p) => sum + p.total, 0),
      },
    };
  }, [registry, progress]);
}
```

### 3. 侧边栏增加学习路径展示

修改 `src/components/layout/sidebar.tsx`：

在词包列表上方新增"学习路径"区域：

```tsx
// 在侧边栏词包选择区域上方插入
<div className="mb-3">
  <h3 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
    学习路径
  </h3>
  <div className="space-y-1">
    {learningPath.path.map((entry) => (
      <button
        key={entry.packId}
        onClick={() => handleSelectPack(entry.packId)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all text-left",
          entry.packId === currentPack
            ? "bg-[var(--color-action-blue)]/10 text-[var(--color-action-blue)] font-medium"
            : entry.allDone
              ? "text-zinc-400 dark:text-zinc-500"
              : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        )}
      >
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
          ${entry.allDone
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : entry.packId === currentPack
              ? 'bg-[var(--color-action-blue)] text-white'
              : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}"
        >
          {entry.allDone ? "✓" : entry.order}
        </span>
        <div className="flex-1 min-w-0">
          <div className="truncate">{entry.name}</div>
          <div className="text-[10px] text-zinc-400">{entry.completed}/{entry.total}</div>
        </div>
      </button>
    ))}
  </div>
</div>
```

### 4. 完成词包后自动推荐下一个

修改 `src/app/page.tsx` 中章节完成弹窗的逻辑：

在章节完成弹窗（StatsPanel）的底部增加"推荐下一个"提示：

```tsx
// 检查当前词包是否所有章节都完成
const isAllChaptersDone = /* 当前词包所有章节均完成 */;
const nextPack = learningPath.path.find((p) => p.order > currentPackOrder && !p.allDone);

// 在 StatsPanel 中，如果有下一个词包，显示推荐
{isAllChaptersDone && nextPack && (
  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
    <p className="text-xs text-zinc-500 mb-2">
      {currentPackName} 全部完成！下一步：
    </p>
    <button
      onClick={() => switchPack(nextPack.packId)}
      className="w-full py-2 bg-[var(--color-action-blue)] text-white text-sm font-medium rounded-full hover:brightness-110 transition-all active:scale-95"
    >
      开始学习 {nextPack.name} →
    </button>
  </div>
)}
```

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/hooks/use-learning-path.ts` | 新建 |
| `src/lib/constants.ts` | 新增 LEARNING_PATH 数组 |
| `src/components/layout/sidebar.tsx` | 新增学习路径展示区域 |
| `src/app/page.tsx` | 完成弹窗增加"推荐下一个" |

### 自测清单

- [ ] 侧边栏显示学习路径列表（1-6 有序）
- [ ] 已完成词包显示 ✓ 标记
- [ ] 当前选中词包高亮
- [ ] 完成整个词包后弹窗推荐下一个
- [ ] 点击推荐按钮自动切换到下一个词包
- [ ] 所有词包完成后不显示"推荐下一个"

### 不需要做的

- 不需要强制用户按路径学习（可自由选择任何词包）
- 不需要动画效果
- 不需要难度分级（所有词包当前都是 level 1，路径按学习逻辑排序即可）
