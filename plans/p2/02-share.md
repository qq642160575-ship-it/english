# P2-2: 分享机制

## 问题

零推广预算的产品需要用户自传播。目前用户完成学习后没有任何分享出口。

## 目标

在章节完成时提供一键分享入口，分享内容包括用户的学习成果。

## 实现方案

### Step 1: 在章节完成弹窗中添加分享按钮

修改 page.tsx 中的章节完成弹窗（约 459-484 行），在现有按钮下方追加：

```tsx
{/* 分享 */}
<div className="mt-4 pt-4 border-t border-zinc-200/30 dark:border-zinc-800/30">
  <button
    onClick={handleShare}
    className="w-full flex items-center justify-center gap-2 py-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
  >
    分享我的学习成果
  </button>
</div>
```

### Step 2: 实现 `handleShare`

```tsx
const handleShare = useCallback(() => {
  const chapterTitle = chapters.find((c) => c.chapter === state.chapter)?.title ?? `Chapter ${state.chapter}`;
  const shareText = `在 keykey.cc 上完成了「${chapterTitle}」的练习！正确率 ${accuracy}%，共 ${state.stats.letters} 个字母。你也来试试？https://keykey.cc`;

  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({
      title: "keykey.cc - 英语打字学习",
      text: shareText,
      url: "https://keykey.cc",
    }).catch(() => {
      // 用户取消分享不处理
    });
  } else {
    // 兜底：复制链接
    navigator.clipboard.writeText(shareText).catch(() => {
      // fallback: 提示用户手动复制
    });
  }
}, [chapters, state.chapter, state.stats]);
```

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/app/page.tsx` | 增加分享按钮和 handleShare |

### 自测清单

- [ ] 章节完成弹窗底部显示"分享"按钮
- [ ] 移动端调用原生分享面板（navigator.share）
- [ ] PC 端复制分享文案到剪贴板
- [ ] 分享文案包含学习成果和链接

### 不需要做的

- 不需要生成图片分享卡片
- 不需要第三方 SDK
- 不需要社交平台专属链接
