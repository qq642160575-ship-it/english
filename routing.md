# Agent Routing — Phase 2

## 当前阶段: direct_fix → ux_ui → full_cycle

---

### 执行序列

```
Phase 1: direct_fix  (Orchestrator 直接修复)
  ├── fix_003: TTS debounce — 消除每字母发音轰炸
  └── fix_004: "恢复默认词库"增加确认弹窗 — 防止误触数据丢失

Phase 2: ux → ui  (UX分析已完成 → 直接UI实施)
  ├── uxui_005: 顶部栏信息密度优化 — 折叠不常用操作
  ├── uxui_006: 听写模式切换增加过渡动画
  ├── uxui_007: "提示"功能剩余次数透明化
  └── uxui_008: 虚拟键盘按键语义改进

Phase 3: full_cycle  (句子模式体验优化)
  └── uxui_009: 句子模式 auto-advance delay 差异化 + 表情展示优化
```

### 改动文件

| 文件 | 改动 |
|------|------|
| `src/app/page.tsx` | TTS debounce, 恢复确认弹窗, 顶部栏折叠, 听写动画, 提示文案, 句子delay |
| `src/components/game/virtual-keyboard.tsx` | 按键语义改进 |
