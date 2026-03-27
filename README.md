# RayPrism

> 面向 AI Agent 工作流的多分支框架模板——选择分支、一键实例化、AI 即刻开工。

## 快速开始

```bash
# 一行创建项目（自动下载，无需安装）
npx rayprism init dev my-app

# 进入项目，开始工作
cd ~/Projects/my-app
```

其他分支同理：

```bash
npx rayprism init content my-blog --git    # 内容创作
npx rayprism init pro my-report            # 专业文档
npx rayprism init ops my-infra             # 运维管理
```

> 💡 **频繁使用？** 全局安装更方便：`npm install -g rayprism`，之后直接 `rayprism init ...`
>
> 首次运行会自动从 GitHub 下载模板到 `~/.rayprism/framework/`，后续使用缓存。

## 核心概念

RayPrism 是**框架模板**，不是具体项目。

- `branches/` 下的四个分支模板是**只读的类定义**
- 通过 `rayprism init` 将模板**实例化**为独立的项目空间
- 框架升级通过 `rayprism upgrade` 一键完成，不影响项目产出

```
RayPrism/（框架，只读）          实例化项目（可写）
========================         ========================
branches/                        my-app/
├── pro/                         ├── framework/ → branches/dev/  🔗
├── content/   rayprism init     ├── .agents/skills/  (合并视图)
├── dev/       ──────────────→   ├── .claude/rules/   (合并视图)
└── ops/                         ├── overrides/       (自定义扩展)
                                 └── workspace/       (所有产出)
```

## 四个分支

| 分支 | 适合场景 | 主力技能 |
|------|---------|---------|
| **pro** | 知识整理 / Obsidian 笔记 | obsidian-markdown, obsidian-bases, json-canvas |
| **content** | 公众号 / 内容创作 | ray-content-wechat-generating, ray-multi-party-mode |
| **dev** | 工程开发 / 代码 | ray-util-antigravity-bridging, vercel-react-best-practices |
| **ops** | 系统运维 / 排障 | tavily-search, agent-browser |

## 项目管理

```bash
rayprism list              # 查看可用分支
rayprism projects          # 列出所有已创建项目
rayprism status            # 查看当前项目信息（在项目目录内）
rayprism upgrade           # 升级框架到最新版本
rayprism unregister <name> # 从注册表移除项目
```

## 框架结构

```
RayPrism/
├── package.json           ← npm 包配置
├── bin/rayprism.js        ← CLI 入口
├── src/                   ← CLI 源码
│
├── README.md              ← 当前文件
├── AGENTS.md              ← AI Agent 主规则
├── CLAUDE.md              ← Claude Code 规则入口
│
└── branches/              ← 四分支纯净模板（只读）
    ├── pro/               ← 知识管理 / Obsidian
    ├── content/           ← 内容创作流水线
    ├── dev/               ← 工程开发
    └── ops/               ← 系统运维
```

## 文档

- [**使用手册**](setup/README.md) — 完整的一步一步指南
- [验证清单](setup/checklist.md) — 初始化后的检查项

## License

MIT
