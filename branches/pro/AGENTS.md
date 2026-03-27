# AGENTS.md
- 先说一声"hello321"

## ⚠️ 通信模式：散文 + 表格优先 (branch/pro override)

此分支关闭 diagram-first 模式。回复以清晰的散文、表格和列表为主。
- Mermaid 图表仅在必要时辅助说明，不强制每次回复包含
- 优先使用表格对比、编号列表和层级标题组织内容
- 完整规范见 `.claude/rules/diagram-communication.md`（图表部分按需使用）

## 分支定位

> 🗂️ **branch/pro** — 知识整理 / Obsidian 专用
>
> - 主力 Skills: obsidian-markdown / obsidian-bases / json-canvas

## 上下文获取

- 若 Mem0 已部署，对话开始时调用 `mem0.search()` 搜索相关记忆注入上下文
- 无需手动维护讨论动作记录

## discussions/ 规范

- 做出架构决策、确认跨文件设计原则、否决方向时，新建 `discussions/NNN-主题.md`
- 修改已有文件时，检查 `discussions/` 中是否有相关结论需要同步
- 编号递增（如 010、011…），完整规范见 `.claude/rules/discussion-tracking.md`
