# P3-07: 单词配图 — Emoji 方案 (P2)

## 问题

当前学习界面只有文字（英文 + 中文 + 音标），缺少视觉通道的辅助。对于低水平学习者，"看到单词 → 脑中浮现图像 → 对应发音"是比纯文字记忆强 3-5 倍的学习方式。

- 名词类词汇（cat, apple, house）天生适合配图
- 当前所有词汇只有文字抽象表示
- 缺少"视觉锚点"帮助记忆

## 目标

以最低成本为每个常用单词配图，利用视觉+听觉双通道强化记忆。

## 实现方案（极低成本版：使用 Emoji）

### 1. 创建 emoji 映射文件

新建 `src/data/emoji-map.ts`：

```ts
/**
 * 英文单词 → Emoji 映射
 * 覆盖所有内置词包中的名词性词汇
 * 抽象词汇（如 "the", "is", "a"）不配图
 */
export const EMOJI_MAP: Record<string, string> = {
  // basic-words
  cat: "🐱",
  dog: "🐶",
  book: "📖",
  apple: "🍎",
  sun: "☀️",
  moon: "🌙",
  star: "⭐",
  fish: "🐟",
  bird: "🐦",
  tree: "🌳",
  flower: "🌸",
  house: "🏠",
  car: "🚗",
  ball: "⚽",
  hat: "🧢",
  shoe: "👟",
  milk: "🥛",
  bread: "🍞",
  egg: "🥚",
  rice: "🍚",
  water: "💧",
  hand: "✋",
  eye: "👁️",
  ear: "👂",
  nose: "👃",
  mouth: "👄",
  baby: "👶",
  school: "🏫",

  // colors
  red: "🔴",
  blue: "🔵",
  green: "🟢",
  yellow: "🟡",
  black: "⚫",
  white: "⚪",
  circle: "⭕",
  square: "🟦",
  triangle: "🔺",
  heart: "❤️",
  rainbow: "🌈",

  // animals
  lion: "🦁",
  tiger: "🐯",
  elephant: "🐘",
  monkey: "🐵",
  panda: "🐼",
  bear: "🐻",
  fox: "🦊",
  rabbit: "🐰",
  horse: "🐴",
  cow: "🐮",
  pig: "🐷",
  sheep: "🐑",
  chicken: "🐔",
  duck: "🦆",
  frog: "🐸",
  turtle: "🐢",
  whale: "🐳",
  dolphin: "🐬",
  penguin: "🐧",
  owl: "🦉",
  eagle: "🦅",
  butterfly: "🦋",
  snail: "🐌",
  bee: "🐝",
  ant: "🐜",
  spider: "🕷️",
  mouse: "🐭",
  snake: "🐍",

  // daily
  table: "🪑",
  chair: "🪑",
  door: "🚪",
  window: "🪟",
  bed: "🛏️",
  lamp: "💡",
  clock: "🕐",
  phone: "📱",
  computer: "💻",
  tv: "📺",
  key: "🔑",
  pen: "🖊️",
  paper: "📄",
  bag: "👜",
  cup: "☕",
  plate: "🍽️",
  knife: "🔪",
  spoon: "🥄",
  fork: "🍴",
  soap: "🧼",
  towel: "🧴",
  brush: "🖌️",
  mirror: "🪞",
  comb: "🪮",

  // food
  pizza: "🍕",
  hamburger: "🍔",
  hotdog: "🌭",
  sandwich: "🥪",
  fries: "🍟",
  chicken: "🍗",
  cake: "🎂",
  cookie: "🍪",
  candy: "🍬",
  chocolate: "🍫",
  icecream: "🍦",
  donut: "🍩",
  juice: "🧃",
  coffee: "☕",
  tea: "🫖",
  beer: "🍺",
  wine: "🍷",
  banana: "🍌",
  orange: "🍊",
  grape: "🍇",
  strawberry: "🍓",
  watermelon: "🍉",
  lemon: "🍋",
  cherry: "🍒",
  peach: "🍑",
  corn: "🌽",
  carrot: "🥕",
  tomato: "🍅",
  potato: "🥔",
  onion: "🧅",
  garlic: "🧄",

  // body
  head: "👤",
  hair: "💇",
  face: "😊",
  tooth: "🦷",
  tongue: "👅",
  arm: "💪",
  leg: "🦵",
  foot: "🦶",
  finger: "👆",
  knee: "🦶",
  back: "🔙",
  neck: "🧣",
  shoulder: "🦾",
  stomach: "🤰",
  bone: "🦴",
};
```

### 2. 在 TargetDisplay 中显示 Emoji

修改 `src/components/game/target-display.tsx`，在单词上方或旁边显示 emoji：

```tsx
import { EMOJI_MAP } from "@/data/emoji-map";

// 在组件内
const emoji = EMOJI_MAP[target.toLowerCase()];

// JSX 中，在单词上方添加
{emoji && (
  <span className="block text-3xl text-center mb-2" role="img" aria-hidden="true">
    {emoji}
  </span>
)}
```

### 3. Emoji 显示逻辑

- 只有 `EMOJI_MAP` 中有映射的单词才显示 emoji
- 不匹配的单词不显示（不破坏布局）
- emoji 大小为 `text-3xl`，居中显示在英文单词上方
- 暗色/亮色模式下 emoji 不变（emoji 自带颜色）

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/data/emoji-map.ts` | 新建 |
| `src/components/game/target-display.tsx` | 添加 emoji 渲染 |

### 自测清单

- [ ] 有 emoji 映射的单词（如 cat 🐱）显示正确 emoji
- [ ] 没有 emoji 映射的单词（如 "the"）不显示 emoji
- [ ] 生成的 emoji 在亮色/暗色模式下均清晰可见
- [ ] emoji 大小合适，不遮挡单词文字
- [ ] 句子模式下每个单词都检查是否有 emoji

### 不需要做的

- 不需要使用真实图片 API（Unsplash 等），成本高且需要网络
- 不需要动画效果
- 不需要用户上传图片
- 不需要 emoji 的替换/编辑功能
- 不需要覆盖所有单词（覆盖 80% 名词即可，抽象词汇本来就不适合配图）
