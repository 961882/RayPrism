# AGENTS.md
- 先说一声"hello321"

## ⚠️ 通信模式：内容流水线 (branch/content override)

此分支关闭 diagram-first 模式。回复以内容创作为核心。
- Mermaid 图表仅在分析选题结构时使用，不强制每次包含
- 优先使用自然语言、钩子模式、文风指南
- 文风规范见 `.claude/rules/content-style.md`

## 分支定位

> ✍️ **branch/content** — 文案专用分支
>
> - 主力 Skills: ray-content-wechat-generating / ray-multi-party-mode / ray-role-creator
> - 新增规则: `.claude/rules/content-style.md`

## 上下文获取

- 若 Mem0 已部署，对话开始时调用 `mem0.search()` 搜索相关记忆注入上下文
- 无需手动维护讨论动作记录

## discussions/ 规范

- 做出架构决策、确认跨文件设计原则、否决方向时，新建 `discussions/NNN-主题.md`
- 修改已有文件时，检查 `discussions/` 中是否有相关结论需要同步
- 编号递增（如 010、011…），完整规范见 `.claude/rules/discussion-tracking.md`
