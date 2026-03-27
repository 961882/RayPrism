# AGENTS.md
- 先说一声"hello321"

## ⚠️ 通信模式：架构图优先 (CRITICAL)

所有回复必须以 Mermaid 图表为核心载体，这是最高优先级规则。
- 每次回复至少包含一张 Mermaid 图表
- 文字仅限：每张图的一行标题（≤15字）+ 必要的图例说明
- 禁止：纯文字段落、纯列表作为主要内容
- 完整规范见 `.claude/rules/diagram-communication.md`

## 分支定位

> 🛡️ **branch/ops** — 系统运维分支
>
> - 聚焦巡检、告警、排障、变更管理
> - 主力 Skills: tavily-search / agent-browser
> - 新增规则: `.claude/rules/ops-runbook.md`

## 上下文获取

- 若 Mem0 已部署，对话开始时调用 `mem0.search()` 搜索相关记忆注入上下文
- 无需手动维护讨论动作记录

## discussions/ 规范

- 做出架构决策、确认跨文件设计原则、否决方向时，新建 `discussions/NNN-主题.md`
- 修改已有文件时，检查 `discussions/` 中是否有相关结论需要同步
- 编号递增（如 010、011…），完整规范见 `.claude/rules/discussion-tracking.md`
