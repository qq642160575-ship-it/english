# English Typing Learner — 设计文档

## 一、项目定位

**一句话描述**：一个纯前端的英语学习网站，用户在敲击每个字母时即时触发音标发音，通过"敲击即发音"的强反馈机制，帮助低基础用户建立字母→音标→发音的神经关联。

**目标用户**：
- 英语基础 2~3 / 10（词汇量小、拼写不熟）
- 口语 0~4 / 10（不敢开口、发音不准）

**核心理念**：不要求用户跟读（他们会默默自主跟读），不做录音和评分。**提供即时、准确的音标发音反馈即可**。

---

## 二、功能规划（分阶段实施）

### Phase 1 — 核心语音反馈系统 ✅（本次实现）

| 功能 | 说明 |
|------|------|
| 字母发音反馈 | 用户每敲击一个字母键（a-z），播放该字母的标准音标发音 |
| 单词学习模式 | 展示一个英文单词 + 中文释义，用户逐字母敲击拼写 |
| 句子学习模式 | 展示一个英文句子 + 中文释义，用户逐字母敲击打出整个句子 |
| 单词/句子自动发音 | 进入新词/句时，自动朗读完整单词/句子一遍 |
| 进度管理 | 当前词/句完成后自动进入下一个 |
| 键盘视觉高亮 | 虚拟键盘展示，当前敲击的字母高亮 |

> **暂不做的**：后端服务、用户登录、数据持久化（用 localStorage）、录音、跟读评分、复杂动画

### Phase 2 — 学习增强（后续）

- 词库管理（收藏、跳过、复习）
- 学习统计（今日敲击量、正确率）
- 多词库/分类（四级、六级、日常）
- 拼写提示（显示字母数 hint）
- 音标可视化（同步显示音标符号）

### Phase 3 — 个性化（后续）

- 学习计划
- 错词本强化
- 每日挑战
- 自定义词库导入

---

## 三、技术架构

### 技术选型

```
纯前端单页应用（SPA）
├── 框架: 原生 HTML + CSS + JavaScript (Vanilla JS)
│   └── 理由: 零构建、零依赖、即开即用，用户直接打开 index.html 即可使用
├── 语音引擎: Web Speech API (SpeechSynthesisUtterance)
│   └── 理由: 浏览器原生 TTS，支持美式/英式发音，无需外部 API 或音频文件
├── 存储: localStorage
│   └── 理由: 纯前端持久化学习记录
└── 样式: 纯 CSS（无框架，保持轻量）
    └── 理由: 减少依赖，极致轻量
```

### 语音反馈核心逻辑（POC 验证通过）

经过 POC 测试确认，**直接使用当前已输入文本片段喂给 TTS 效果可接受**，不需要音标映射表。

```
用户敲击字母键
  → 获取当前已输入的完整前缀文本（如 "ca"）
  → cancel() 清空语音队列
  → 构造 SpeechSynthesisUtterance(前缀文本)
  → 设置 lang='en-US', rate=0.75, pitch=1.0
  → 选择美式英语语音
  → speechSynthesis.speak(utterance)

示例：
  敲 c → 输入 "c"  → TTS 读 "c"（字母名 /siː/，可接受）
  敲 a → 输入 "ca" → TTS 读 "ca"（近似 /kɑː/，接近）
  敲 t → 输入 "cat" → TTS 读 "cat"（标准 /kæt/ ✅）
```

**句子模式**：只朗读当前正在输入的单词前缀（不读整句），保持和单词模式一致的学习体验。

**机器人声问题**：通过选择最优美式英语语音 + 调整语速 (rate=0.75) 改善听感。

---

## 四、UI 设计

### 布局（单页应用）

```
┌──────────────────────────────────────┐
│             顶部导航栏                 │
│  [Logo]  单词模式 | 句子模式          │
├──────────────────────────────────────┤
│                                      │
│   ┌──────────────────────────────┐   │
│   │       学习内容展示区          │   │
│   │   英文: [_____________]       │   │
│   │   中文: [_____]              │   │
│   │   ┌──────────────────┐       │   │
│   │   │   输入文本框       │       │   │
│   │   │   (实时显示敲击)   │       │   │
│   │   └──────────────────┘       │   │
│   └──────────────────────────────┘   │
│                                      │
│   ┌──────────────────────────────┐   │
│   │       虚拟键盘（视觉辅助）    │   │
│   │  Q W E R T Y U I O P        │   │
│   │   A S D F G H J K L         │   │
│   │    Z X C V B N M            │   │
│   │  [空格]      [退格]         │   │
│   └──────────────────────────────┘   │
│                                      │
│   [进度条] 2/20   [下一个 →]         │
│                                      │
└──────────────────────────────────────┘
```

### 交互流程

**单词模式**：
1. 页面展示一个英文单词（如 "apple"）+ 中文释义 "苹果"
2. 同时自动播放一遍完整单词发音
3. 用户开始逐字母输入 a-p-p-l-e
4. 每敲一个字母 → 发出该字母的音 → 该字母在键盘上高亮
5. 输入框同步显示已输入内容
6. 当前字符正确时变绿，错误时变红（即时纠错）
7. 完整拼写正确 → 自动播放一遍正确发音 → 短暂庆祝 → 自动进入下一个词

**句子模式**：
1. 展示一个英文句子 + 中文释义
2. 自动播放完整句子发音
3. 用户逐字母敲出整句（包括空格）
4. 每字母发音反馈 + 键盘高亮
5. 每正确完成一个单词 → 自动读该单词标准发音
6. 句子完成 → 播放完整句子发音 → 进入下一句

---

## 五、内置词库设计

### 单词库（Phase 1 内置 30 个最常用词）

```javascript
const wordBank = [
  { en: "apple", zh: "苹果" },
  { en: "book", zh: "书" },
  { en: "cat", zh: "猫" },
  // ...共 50 个高频基础词
];
```

### 句子库（Phase 1 内置 10 个基础句）

```javascript
const sentenceBank = [
  { en: "I am a student.", zh: "我是一名学生。" },
  { en: "This is a book.", zh: "这是一本书。" },
  // ...共 20 句
];
```

---

## 六、文件结构

```
english-test/
├── index.html          # 主入口（所有 HTML + CSS + JS 都在此文件）
├── DESIGN.md           # 本设计文档
└── README.md           # 项目说明（可选）
```

**选择单文件的原因**：
- 零配置，用户双击 index.html 即可使用
- 初始阶段不需要构建工具
- 后续可自然拆分为多文件架构

---

## 七、语音反馈技术细节

### Web Speech API 使用方案

```javascript
function speakLetter(letter) {
  const utterance = new SpeechSynthesisUtterance(letter);
  utterance.lang = 'en-US';
  utterance.rate = 0.8;       // 稍慢，便于听清
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // 可选：选择美式英语语音
  const voices = speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en-US'));
  if (enVoice) utterance.voice = enVoice;

  speechSynthesis.speak(utterance);
}

function speakWord(word) {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.7;       // 完整词更慢
  speechSynthesis.speak(utterance);
}
```

### 关键考虑

1. **语音队列**：Web Speech API 自带队列，连续敲键会自动排队，无需额外处理
2. **打断**：进入新词时调用 `speechSynthesis.cancel()` 清空队列再播新词
3. **移动端兼容**：iOS Safari 需要用户手势（click/touch）触发首次 SpeechSynthesis
4. **Chrome 限制**：需要用户与页面有至少一次交互后才能使用 SpeechSynthesis

### 键盘事件处理

```javascript
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key >= 'a' && key <= 'z') {
    e.preventDefault();  // 防止输入框意外行为
    handleLetterInput(key);
  } else if (key === ' ') {
    e.preventDefault();
    handleSpace();
  } else if (key === 'backspace') {
    handleBackspace();
  }
});
```

---

## 八、数据模型

```javascript
// 学习状态（localStorage 持久化）
const learningState = {
  mode: 'word',              // 'word' | 'sentence'
  wordIndex: 0,              // 当前词库索引
  sentenceIndex: 0,          // 当前句子库索引
  currentInput: '',          // 当前已输入内容
  completedWords: [],        // 已完成的词
  completedSentences: [],    // 已完成的句子
  stats: {
    lettersTyped: 0,
    wordsCompleted: 0,
    sentencesCompleted: 0,
  }
};
```

---

## 九、实现优先级

### 本次 Phase 1 实现顺序

1. **HTML 结构 + CSS 基础布局** → 页面骨架
2. **词库/句库数据** → 内置基础数据
3. **核心语音反馈** → 敲键发音（最关键功能）
4. **单词模式交互** → 展示 + 输入 + 校验 + 自动跳转
5. **句子模式交互** → 展示 + 输入 + 校验 + 自动跳转
6. **模式切换** → 单词/句子切换
7. **虚拟键盘** → 视觉辅助键盘
8. **进度条 + 统计** → 学习进度可视化
