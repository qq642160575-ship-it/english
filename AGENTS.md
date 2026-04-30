<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:multi-agent-system -->
# 多 Agent 开发系统（奥卡姆编排）

本项目集成了多 Agent 开发系统。由 Orchestrator 根据需求动态编排 Agent 序列。

**核心原则：奥卡姆剃刀 — 如无必要，勿增实体。**

- `@agents/orchestrator/AGENTS.md` — 主 Agent，负责需求分析与动态编排
- `@agents/feature/AGENTS.md` — 功能 Agent（实现功能，不改视觉）
- `@agents/ux/AGENTS.md` — UX Agent（分析体验，只提建议）
- `@agents/ui/AGENTS.md` — UI Agent（优化视觉，不改逻辑）

**编排规则（由 Orchestrator 动态决定）：**
| 需求类型 | Agent 组合 |
|---------|-----------|
| Bug 修复 | 直接修复，不走 Agent |
| 纯视觉调整 | 只需 UI Agent |
| 体验问题 | UX → UI |
| 功能缺失 | Feature 或 Feature → UI |
| 综合需求 | Feature → UX → UI |

**核心原则：** 奥卡姆剃刀、串行执行、职责隔离、按需追加。详见 `agents/README.md`。
<!-- END:multi-agent-system -->
