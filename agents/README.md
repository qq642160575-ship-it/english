<!--
  file: README.md
  purpose: 多 Agent 串行开发系统总览
-->

# 多 Agent 开发系统（奥卡姆编排）

本系统由 Orchestrator 根据需求动态编排 Agent，以串行方式推进开发。

## 核心原则

1. **奥卡姆剃刀** — 如无必要，勿增实体。能用 1 个 Agent 绝不用 2 个
2. **串行执行** — 任意时刻只允许一个子 Agent 工作
3. **职责隔离** — Feature 不改视觉，UI 不改逻辑，UX 不改代码
4. **文件驱动** — 所有任务和状态通过 `task_list.json` 落盘
5. **按需追加** — 不强行启动不需要的 Agent，也不怕在需要时追加

## Agent 角色

| Agent | 文件 | 职责 |
|-------|------|------|
| **Orchestrator** | `orchestrator/AGENTS.md` | 需求分析、动态编排、调度决策（不写代码） |
| **Feature** | `feature/AGENTS.md` | 分析并实现功能代码（不改视觉） |
| **UX** | `ux/AGENTS.md` | 分析体验问题并提建议（不改代码） |
| **UI** | `ui/AGENTS.md` | 优化界面视觉表达（不改功能） |

## 编排规则

Orchestrator 根据需求类型动态选择 Agent 组合：

| 需求类型 | Agent 组合 | 示例 |
|---------|-----------|------|
| Bug 修复 | 直接修复 | "切换模式后状态没重置" |
| 纯视觉调整 | `UI` | "导航按钮太小了看不到" |
| 体验问题 | `UX → UI` | "用户不知道什么时候能继续" |
| 功能缺失 | `Feature` | "缺少导入词库功能" |
| 功能+展示 | `Feature → UI` | "添加复习模式并优化展示" |
| 综合需求 | `Feature → UX → UI` | 完整产品迭代 |
| 复杂任务 | 拆解后按需编排 | "重构整个设置页面" |

## 文件结构

```
agents/
├── README.md                 ← 本文件
├── routing.md                ← Orchestrator 写入的路由指令
├── orchestrator/
│   ├── AGENTS.md             ← Orchestrator 系统提示词 (v2)
│   └── task_list.json        ← 流程状态 + 编排计划
├── feature/
│   ├── AGENTS.md             ← Feature Agent 系统提示词
│   └── task_list.json        ← 功能任务
├── ux/
│   ├── AGENTS.md             ← UX Agent 系统提示词
│   └── task_list.json        ← UX 优化任务
└── ui/
    ├── AGENTS.md             ← UI Agent 系统提示词
    └── task_list.json        ← UI 优化任务
```

## 启动方式

Orchestrator 收到用户请求后：
1. 理解需求，确定类型
2. 应用奥卡姆剃刀选择最少 Agent
3. 记录 plan 到 `task_list.json`
4. 更新 `routing.md` 激活首个 Agent
5. 执行直到完成，输出总结
