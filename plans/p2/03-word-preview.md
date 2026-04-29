# P2-3: 词库预览

## 问题

用户在侧边栏或章节选择时，看不到章节内容。选择章节目前是盲选——无法判断难度是否适合自己。

## 目标

让用户在点击进入某个章节之前，能看到该章节的前几个词，辅助判断是否选择。

## 实现方案

### Step 1: 修改章节选择 UI

在 page.tsx 底部章节指示器/或者侧边栏的类别选择中，增加 hover 预览。

最小实现方式：在章节选择按钮上增加 title 属性显示前 5 个词：

```tsx
// 获取章节的前 5 个词
const chapterPreview = (chapter: number): string => {
  const items = dataRegistry.getItemsByChapter(state.category, chapter);
  return items.slice(0, 5).map((item) => item.en).join(", ") + (items.length > 5 ? "..." : "");
};
```

在章节按钮上：

```tsx
<button
  key={ch.chapter}
  onClick={() => handleChapterChange(ch.chapter)}
  title={chapterPreview(ch.chapter)}  // 添加 native title
  className={cn(...)}
>
  {ch.title}
</button>
```

这是最简实现。如果需要更好的体验，可以做一个 tooltip 组件：

### Step 2: 创建简易 Tooltip（可选）

`src/components/ui/simple-tooltip.tsx`

```tsx
"use client";

import { useState } from "react";

export function SimpleTooltip({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded-lg whitespace-nowrap shadow-lg z-50">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
        </div>
      )}
    </div>
  );
}
```

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/app/page.tsx` | 章节按钮增加 title 或 tooltip |
| `src/components/ui/simple-tooltip.tsx` | 新建（可选） |

### 自测清单

- [ ] 鼠标悬停章节按钮时显示前 5 个词
- [ ] 显示格式清晰易读
- [ ] 不影响正常点击行为

### 不需要做的

- 不需要完整的词库列表页面
-不需要搜索功能
- 不需要难度标签
