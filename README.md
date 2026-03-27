# RayPrism

> 面向 AI Agent 工作流的多分支框架模板——选择分支、一键实例化、AI 即刻开工。

## 快速开始

```bash
# 1. 克隆框架
git clone https://github.com/961882/RayPrism.git
cd RayPrism

# 2. 安装 rp 命令
ln -sf $(pwd)/setup/rp.sh ~/.local/bin/rp

# 3. 查看可用分支
rp list

# 4. 创建项目
rp init dev my-app --git

# 5. 进入项目，开始工作
cd ~/Projects/my-app
```

## 核心概念

RayPrism 是**框架模板**，不是具体项目。

- `branches/` 下的四个分支模板是**只读的类定义**
- 通过 `rp init` 将模板**实例化**为独立的项目空间
- 框架升级通过 `rp upgrade` 一键完成，不影响项目产出

```
RayPrism/（框架，只读）          实例化项目（可写）
========================         ========================
branches/                        my-app/
├── pro/                         ├── framework/ → branches/dev/  🔗
├── content/        rp init      ├── .agents/skills/  (合并视图)
├── dev/         ──────────→     ├── .claude/rules/   (合并视图)
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
rp list              # 查看可用分支
rp projects          # 列出所有已创建项目
rp status            # 查看当前项目信息（在项目目录内）
rp upgrade           # 升级框架到最新版本
rp unregister <name> # 从注册表移除项目
```

## 框架结构

```
RayPrism/
├── README.md              ← 当前文件
├── AGENTS.md              ← AI Agent 主规则
├── CLAUDE.md              ← Claude Code 规则入口
├── GEMINI.md              ← Gemini CLI 规则入口
│
├── setup/                 ← 初始化工具与文档
│   ├── README.md          ← rp 使用手册（完整版）
│   ├── rp.sh              ← 项目初始化 CLI 工具
│   ├── init.sh            ← 框架环境一键初始化
│   ├── trigger.sh         ← 对话日志监听触发器
│   └── checklist.md       ← 手动验证清单
│
└── branches/              ← 四分支纯净模板（只读）
    ├── pro/               ← 知识管理 / Obsidian
    ├── content/           ← 内容创作流水线
    ├── dev/               ← 工程开发
    └── ops/               ← 系统运维
```

## 文档

- [**rp 使用手册**](setup/README.md) — 完整的一步一步指南
- [验证清单](setup/checklist.md) — 初始化后的检查项

## License

MIT
