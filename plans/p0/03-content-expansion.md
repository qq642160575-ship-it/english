# P0-3: 内容量扩充

## 问题

当前仅内置 29 个单词（3 章）+ 10 个句子。一个认真的初学者 15 分钟就能刷完所有内容。学完之后没有任何新内容可练。

## 目标

将内容扩充到 200+ 词 + 30+ 句子，覆盖多个主题，让用户有至少一周的练习量。

## 实现方案

### Step 1: 创建新词包数据文件

在 `src/data/words/` 下新增以下文件。格式参考 `basic.json`：

```json
// src/data/words/colors.json
[
  { "en": "red", "zh": "红色", "ipa": "red", "ib": [1, 2, 3], "chapter": 1 },
  { "en": "blue", "zh": "蓝色", "ipa": "bluː", "ib": [1, 2, 3, 4], "chapter": 1 },
  { "en": "green", "zh": "绿色", "ipa": "ɡriːn", "ib": [1, 2, 3, 4, 5], "chapter": 1 },
  { "en": "white", "zh": "白色", "ipa": "waɪt", "ib": [1, 2, 3, 4, 5], "chapter": 1 },
  { "en": "black", "zh": "黑色", "ipa": "blæk", "ib": [1, 2, 3, 4, 5], "chapter": 1 },
  // ... 更多
]
```

创建以下 5 个词包（每个 30-50 词，分 3 章）：

| 词包 ID | 文件名 | 主题 | 建议词数 | 难度 |
|---|---|---|---|---|
| `colors` | `colors.json` | 颜色 + 形状 | 30 | 1 |
| `animals` | `animals.json` | 常见动物 | 40 | 1 |
| `daily` | `daily.json` | 日常用品 | 50 | 1-2 |
| `food` | `food.json` | 食物饮料 | 40 | 1 |
| `body` | `body.json` | 身体部位 | 35 | 1 |

每个词包需要配套的 `colors.meta.json`：

```json
{
  "id": "colors",
  "type": "word",
  "title": "颜色与形状",
  "description": "基础颜色和形状词汇",
  "difficulty": 1,
  "tags": ["基础", "颜色"],
  "itemCount": 30,
  "isBuiltin": true
}
```

### Step 2: 注册到 DataRegistry

修改 `src/data/registry.ts`：

```tsx
// 新增 imports
import colorsWords from "./words/colors.json";
import colorsWordsMeta from "./words/colors.meta.json";
import animalsWords from "./words/animals.json";
import animalsWordsMeta from "./words/animals.meta.json";
// ... 其他包

// 在 init() 方法中注册
this.builtinPacks.set("colors", validateBuiltinPack(colorsWordsMeta, colorsWords, WordItemSchema) as DataPack);
this.builtinPacks.set("animals", validateBuiltinPack(animalsWordsMeta, animalsWords, WordItemSchema) as DataPack);
// ... 其他包
```

### Step 3: 更新 page.tsx 中的默认类别

当前 page.tsx 写死了 `"basic-words"` 和 `"basic-sentences"`。这些保持不变即可——用户通过 DataRegistry 获取所有可用包列表。需要确认 `getAvailablePacks` 逻辑能同时返回内置和新注册的包。

### Step 4: 添加句子包（可选，P0 优先级低于词包）

句子包同样扩充 3-5 个主题，每个 10 个句子，放在 `src/data/sentences/` 下。

### 涉及文件

| 文件 | 操作 |
|---|---|
| `src/data/words/colors.json` + `.meta.json` | 新建 |
| `src/data/words/animals.json` + `.meta.json` | 新建 |
| `src/data/words/daily.json` + `.meta.json` | 新建 |
| `src/data/words/food.json` + `.meta.json` | 新建 |
| `src/data/words/body.json` + `.meta.json` | 新建 |
| `src/data/registry.ts` | 注册新词包 |

### 关于 IPA 生成

每个词的 `ipa` 和 `ib` 数组需要用工具生成。推荐方法：

1. 使用命令行工具 `espeak`：
   ```bash
   espeak -x "hello" --ipa
   ```
2. 或者使用在线词典 API 获取
3. 或者手动编写（针对简单词汇）

`ib` 数组的计算规则：对每个字母，计算它对应的音标字符串结束位置。例如：
- "red" → ipa: "red" → ib: [1, 2, 3]（每个字母对应 1 个音标字符）
- "blue" → ipa: "bluː" → ib: [1, 2, 3, 4]（注意 `uː` 是两个字符）
- "white" → ipa: "waɪt" → ib: [1, 2, 3, 4, 5]

`ib[n]` = 前 n+1 个字母对应的 IPA 字符串长度。算法参考：

```ts
function computeIb(word: string, ipa: string): number[] {
  // 简单实现：每个字母大致对应均分 IPA 长度
  // 更精确的实现需要音标到字母的映射知识
  const ratio = ipa.length / word.length;
  return word.split("").map((_, i) => Math.round((i + 1) * ratio));
}
```

**注意**：对于 `ib` 不精确的情况，typing 时音标显示可能不完全准确。作为最小实现，建议先用上述 `computeIb` 自动生成后再手动校正。

### 自测清单

- [ ] 每个新词包都能在侧边栏/类别选择中出现
- [ ] 章节导航正确显示
- [ ] 打字、发音、音标显示正常
- [ ] 进度存储正确（按 category 隔离）
- [ ] 没有引入 Zod 验证错误

### 不需要做的

- 不需要 UI 层面的"词包市场"
- 不需要从外部 API 拉取内容
- 不需要用户自定义词包（已有导入功能）
