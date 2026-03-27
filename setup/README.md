# RayPrism · `rp` 使用手册

> 从框架模板到实体项目——一步一步的完整指南。

---

## 目录

1. [安装](#1-安装)
2. [查看可用分支](#2-查看可用分支)
3. [初始化项目](#3-初始化项目)
4. [理解项目目录结构](#4-理解项目目录结构)
5. [自定义扩展（overrides）](#5-自定义扩展overrides)
6. [管理多个项目](#6-管理多个项目)
7. [查看项目状态](#7-查看项目状态)
8. [升级框架版本](#8-升级框架版本)
9. [四个分支的目录结构对比](#9-四个分支的目录结构对比)
10. [常见问题](#10-常见问题)

---

## 1. 安装

### 前置条件

- macOS（bash / zsh）
- Python 3（系统自带）
- Git（使用 `--git` 选项时需要）

### 安装 `rp` 命令

```bash
# 方法 A: 创建符号链接到 PATH（推荐）
ln -sf /path/to/RayPrism/setup/rp.sh ~/.local/bin/rp

# 方法 B: 添加 alias
echo 'alias rp="bash /path/to/RayPrism/setup/rp.sh"' >> ~/.zshrc
source ~/.zshrc
```

### 验证安装

```bash
rp help
```

预期输出:

```
rp — RayPrism 项目工具

命令：
  rp init <branch> <name> [--path /dir] [--git]   初始化新项目
  rp list                                          列出可用分支
  rp projects                                      列出所有已注册项目
  rp unregister <name>                             从注册表移除项目
  rp status                                        查看当前项目信息
  rp upgrade                                       更新框架符号链接

分支: pro | content | dev | ops
```

---

## 2. 查看可用分支

```bash
rp list
```

输出:

```
📦 RayPrism 可用分支
══════════════════════════════════
  ● pro v0.1.0       专业文档 / 策略规划 / 分析报告
  ● content v0.1.0   内容创作 / 公众号 / 社媒运营
  ● dev v0.1.0       软件开发 / 代码 / 架构设计
  ● ops v0.1.0       运维 / 自动化 / 系统管理

用法: rp init <branch> <project-name> [--git]
```

### 分支选择指南

| 场景 | 选择分支 | 主力 Skills |
|------|---------|-------------|
| 写分析报告、策略文档、Obsidian 知识管理 | `pro` | obsidian-markdown, obsidian-bases, json-canvas |
| 写公众号文章、小红书内容、社媒运营 | `content` | ray-content-wechat-generating, ray-multi-party-mode |
| 写代码、做架构设计、开发应用 | `dev` | ray-util-antigravity-bridging, vercel-react-best-practices |
| 系统运维、巡检排障、自动化脚本 | `ops` | agent-browser, tavily-search |

---

## 3. 初始化项目

### 基础用法

```bash
rp init <branch> <project-name>
```

项目会创建在 `~/Projects/<project-name>/`：

```bash
# 示例: 创建一个开发项目
rp init dev my-saas-app
```

### 指定路径

```bash
rp init content my-blog --path ~/Work/my-blog
```

### 初始化时同时创建 Git 仓库

```bash
rp init dev my-app --git
```

加 `--git` 后会自动：
1. `git init`
2. 生成排除框架符号链接的 `.gitignore`
3. `git add -A && git commit -m "init: rp init dev my-app (v0.1.0)"`

### 完整初始化流程（背后发生了什么）

```
rp init dev my-app --git
```

执行步骤：

| 步骤 | 操作 | 产物 |
|------|------|------|
| ① | 创建项目目录 | `~/Projects/my-app/` |
| ② | 创建 `framework/` 符号链接 | 指向 `branches/dev/`（只读） |
| ③ | 创建 `overrides/` 目录 | `overrides/rules/` + `overrides/skills/` |
| ④ | 逐文件链接 `.agents/skills/` | 框架 skills + overrides 合并 |
| ⑤ | 逐文件链接 `.claude/rules/` | 框架 rules + overrides 合并 |
| ⑥ | 链接 `CLAUDE.md` / `GEMINI.md` | 指向 `framework/` 下的同名文件 |
| ⑦ | 创建 `workspace/` 目录结构 | 分支专属子目录 |
| ⑧ | 生成 `workspace/README.md` | 目录用途说明 |
| ⑨ | 生成 `AGENTS.md` | AI 工具配置（含只读声明 + 覆盖说明） |
| ⑩ | 写入 `.rayprism.json` | 项目元信息（名称、分支、版本） |
| ⑪ | 生成 `.gitignore` | 排除框架链接和临时文件 |
| ⑫ | 注册到全局注册表 | `~/.rayprism/registry.json` |
| ⑬ | 执行 post-init hook | `branches/dev/post-init.sh` |
| ⑭ | Git 初始化（如 `--git`） | `git init` + 首次 commit |

---

## 4. 理解项目目录结构

以 `rp init dev my-app --git` 为例（dev 分支），生成的**完整**目录结构：

```
my-app/                                         ← 项目根目录
│
│  ── 元信息 & Git ──────────────────────────────
│
├── .rayprism.json                               ← 📌 项目元信息 (221B)
│   {                                               ┌──────────────────────┐
│     "name": "my-app",                             │ 记录分支、版本、来源 │
│     "branch": "dev",                              │ rp status 读取此文件 │
│     "source": "/.../RayPrism/branches/dev",       └──────────────────────┘
│     "rayprism_home": "/.../RayPrism",
│     "template_version": "0.1.0",
│     "created": "2026-03-27T11:43:14Z"
│   }
├── .gitignore                                   ← 排除框架链接和临时文件 (193B)
│   排除项:
│     framework, .agents, .claude,
│     CLAUDE.md, GEMINI.md,
│     .env, .DS_Store,
│     workspace/logs/, workspace/incidents/
├── .git/                                        ← Git 仓库（仅 --git 时存在）
│
│  ── AI 工具入口 ───────────────────────────────
│
├── AGENTS.md                                    ← 🤖 自动生成的 wrapper (2129B)
│   内容含：只读声明 + 产出约束 + 覆盖说明 + 分支规则
│
├── CLAUDE.md  ──🔗──→ framework/CLAUDE.md       ← 符号链接 (241B)
├── GEMINI.md  ──🔗──→ framework/GEMINI.md       ← 符号链接 (298B)
│
│  ── 🔒 只读框架（符号链接，禁止修改）──────────
│
├── framework/  ──🔗──→ /Users/ray/Projects/RayPrism/branches/dev
│   │
│   ├── AGENTS.md                                ← 分支角色规则定义 (1119B)
│   ├── CLAUDE.md                                ← Claude Code 兼容声明 (241B)
│   ├── GEMINI.md                                ← Gemini CLI 兼容声明 (298B)
│   ├── VERSION                                  ← 模板版本号 "0.1.0" (6B)
│   ├── post-init.sh                             ← 初始化钩子脚本 (175B)
│   │
│   ├── .agents/
│   │   └── skills/
│   │       ├── get-code-context-exa/            ← Exa 代码上下文搜索
│   │       │   └── SKILL.md
│   │       ├── ray-util-antigravity-bridging/   ← Antigravity 桥接调用
│   │       │   ├── SKILL.md
│   │       │   └── scripts/
│   │       │       └── bridge.ts
│   │       ├── tavily-search/                   ← Tavily AI 搜索
│   │       │   ├── SKILL.md
│   │       │   └── scripts/
│   │       │       └── search.sh
│   │       └── vercel-react-best-practices/     ← React/Next.js 最佳实践
│   │           └── SKILL.md
│   │
│   └── .claude/
│       └── rules/
│           ├── dev-contract.md                  ← 开发合约规则 (637B)
│           ├── diagram-communication.md         ← 架构图通信模式 (3167B)
│           └── discussion-tracking.md           ← 讨论追踪规范 (2314B)
│
│  ── 🧩 AI Skills（合并后的视图）───────────────
│  每个条目都是指向框架对应 skill 的符号链接
│  如果 overrides/skills/ 中有同名目录，本地优先
│
├── .agents/
│   └── skills/
│       ├── get-code-context-exa/  ──🔗──→
│       │   /Users/ray/Projects/RayPrism/branches/dev/.agents/skills/get-code-context-exa/
│       │
│       ├── ray-util-antigravity-bridging/  ──🔗──→
│       │   /Users/ray/Projects/RayPrism/branches/dev/.agents/skills/ray-util-antigravity-bridging/
│       │
│       ├── tavily-search/  ──🔗──→
│       │   /Users/ray/Projects/RayPrism/branches/dev/.agents/skills/tavily-search/
│       │
│       └── vercel-react-best-practices/  ──🔗──→
│           /Users/ray/Projects/RayPrism/branches/dev/.agents/skills/vercel-react-best-practices/
│
│  ── 📏 AI 规则（合并后的视图）─────────────────
│  每个条目都是指向框架对应 rule 文件的符号链接
│  如果 overrides/rules/ 中有同名文件，本地优先
│
├── .claude/
│   └── rules/
│       ├── dev-contract.md  ──🔗──→
│       │   /Users/ray/Projects/RayPrism/branches/dev/.claude/rules/dev-contract.md
│       │
│       ├── diagram-communication.md  ──🔗──→
│       │   /Users/ray/Projects/RayPrism/branches/dev/.claude/rules/diagram-communication.md
│       │
│       └── discussion-tracking.md  ──🔗──→
│           /Users/ray/Projects/RayPrism/branches/dev/.claude/rules/discussion-tracking.md
│
│  ── ✏️ 项目级自定义扩展（可写）────────────────
│
├── overrides/
│   ├── README.md                                ← 使用说明
│   ├── rules/                                   ← (空) 放 .md 规则文件
│   │   └── (你的项目专属规则放这里)
│   └── skills/                                  ← (空) 放 skill 目录
│       └── (你的项目专属 Skills 放这里)
│
│  ── 📁 所有 AI 产出都在这里（可写）────────────
│
└── workspace/
    ├── README.md                                ← 目录用途说明
    ├── src/                                     ← 源代码
    ├── docs/                                    ← 文档
    ├── tests/                                   ← 测试
    ├── artifacts/                               ← 构建产物
    └── experiments/                             ← 实验代码
```

### 符号链接关系全景图

```
项目 my-app/                          RayPrism 框架
═══════════════                       ═══════════════════════════════════
                                      branches/dev/
framework/ ──────────────────────🔗──→ ├── AGENTS.md
                                      ├── CLAUDE.md
CLAUDE.md ───→ framework/CLAUDE.md    ├── GEMINI.md
GEMINI.md ───→ framework/GEMINI.md    ├── VERSION
                                      ├── post-init.sh
.agents/skills/                       ├── .agents/skills/
├── get-code-context-exa/ ───────🔗──→│   ├── get-code-context-exa/
├── ray-util-antigravity-.../ ───🔗──→│   ├── ray-util-antigravity-bridging/
├── tavily-search/ ──────────────🔗──→│   ├── tavily-search/
└── vercel-react-best-.../ ─────🔗──→│   └── vercel-react-best-practices/
                                      │
.claude/rules/                        └── .claude/rules/
├── dev-contract.md ─────────────🔗──→    ├── dev-contract.md
├── diagram-communication.md ────🔗──→    ├── diagram-communication.md
└── discussion-tracking.md ──────🔗──→    └── discussion-tracking.md
```

### 三种文件类型

| 类型 | 标记 | 说明 |
|------|------|------|
| 🔒 只读 | `framework/`、`🔗` 链接 | 来自框架模板，禁止修改，用 `rp upgrade` 更新 |
| ✏️ 可写-配置 | `overrides/`、`AGENTS.md`、`.rayprism.json` | 项目级配置，可自由编辑 |
| 📁 可写-产出 | `workspace/` | AI 所有产出必须放在此目录 |

---

## 5. 自定义扩展（overrides）

### 添加项目专属规则

```bash
cat > overrides/rules/code-style.md << 'EOF'
---
description: 项目代码风格约束
---
- 所有代码注释使用中文
- 变量名使用 camelCase
- 函数名使用 snake_case
EOF
```

运行 `rp upgrade` 后，该规则会自动合并到 `.claude/rules/code-style.md`。

### 添加项目专属 Skill

```bash
mkdir -p overrides/skills/my-deploy-skill
cat > overrides/skills/my-deploy-skill/SKILL.md << 'EOF'
---
name: my-deploy-skill
description: 项目专属部署技能
---
## 部署流程
1. 构建 Docker 镜像
2. 推送到 ECR
3. 更新 ECS 服务
EOF
```

运行 `rp upgrade` 后，该 Skill 会自动出现在 `.agents/skills/my-deploy-skill/`。

### 覆盖框架规则

如果在 `overrides/rules/` 中放置与框架同名的文件，本地版本优先：

```bash
# 覆盖框架自带的 diagram-communication.md
cp overrides/rules/diagram-communication.md  # 自定义版本
rp upgrade  # 重新合并，本地优先
```

---

## 6. 管理多个项目

### 列出所有项目

```bash
rp projects
```

输出：

```
📋 RayPrism 已注册项目 (3)
══════════════════════════════════════════════════════
  ● my-saas-app          dev      v0.1.0  /Users/ray/Projects/my-saas-app
  ● my-blog              content  v0.1.0  /Users/ray/Work/my-blog
  ○ deleted-project      pro      v0.1.0  /Users/ray/Projects/deleted-project
```

- `●` = 目录存在（存活）
- `○` = 目录已删除

### 从注册表移除项目

```bash
rp unregister deleted-project
```

> 仅从注册表移除，**不会删除项目目录**。

---

## 7. 查看项目状态

在项目目录内运行：

```bash
cd ~/Projects/my-app
rp status
```

输出：

```
📋 RayPrism 项目信息
══════════════════════════════════
  项目名称 : my-app
  分支类型 : dev
  框架来源 : /Users/ray/Projects/RayPrism/branches/dev
  模板版本 : 0.1.0
  创建时间 : 2026-03-27T11:10:13Z

  模板版本 : v0.1.0 ✅ 已是最新

  framework/ → /Users/ray/Projects/RayPrism/branches/dev
  overrides/  规则: 1, Skills: 0
```

---

## 8. 升级框架版本

当 RayPrism 框架本体更新后（如 `branches/dev/VERSION` 从 `0.1.0` → `0.2.0`），在项目目录内运行：

```bash
cd ~/Projects/my-app
rp upgrade
```

输出：

```
ℹ️  版本变更: v0.1.0 → v0.2.0
ℹ️  重新链接 framework → /Users/ray/Projects/RayPrism/branches/dev
✅ 链接 .agents/skills/（框架 + 覆盖合并）
✅ 链接 .claude/rules/（框架 + 覆盖合并）
✅ 模板版本已更新为 v0.2.0
✅ 框架已更新至最新版本
```

`rp upgrade` 做的事情：
1. 重新链接 `framework/` 符号链接
2. 重新执行 `.agents/skills/` 和 `.claude/rules/` 的合并（保留 overrides）
3. 更新 `.rayprism.json` 中的版本号
4. 更新全局注册表

---

## 9. 四个分支的目录结构对比

所有分支的项目结构框架相同，区别在于 **workspace 子目录** 和 **Skills/Rules 内容**：

### workspace/ 子目录

| 分支 | workspace/ 子目录 |
|------|--------------------|
| **pro** | `reports/` `strategy/` `analysis/` `drafts/` `references/` |
| **content** | `drafts/` `published/` `assets/` `scheduled/` `archive/` |
| **dev** | `src/` `docs/` `tests/` `artifacts/` `experiments/` |
| **ops** | `scripts/` `configs/` `runbooks/` `logs/` `incidents/` |

### .agents/skills/ 内容

| 分支 | 自带 Skills |
|------|------------|
| **pro** | obsidian-markdown, obsidian-bases, json-canvas |
| **content** | ray-content-wechat-generating, ray-multi-party-mode, ray-role-creator |
| **dev** | get-code-context-exa, ray-util-antigravity-bridging, tavily-search, vercel-react-best-practices |
| **ops** | agent-browser, tavily-search |

### .claude/rules/ 内容

| 分支 | 自带规则文件 |
|------|-------------|
| **pro** | diagram-communication.md, discussion-tracking.md |
| **content** | content-style.md, diagram-communication.md, discussion-tracking.md |
| **dev** | dev-contract.md, diagram-communication.md, discussion-tracking.md |
| **ops** | ops-runbook.md, diagram-communication.md, discussion-tracking.md |

---

## 10. 常见问题

### Q: 我可以同时有多个同类型分支的项目吗？

**可以**。每个 `rp init` 创建独立的项目目录，互不干扰：

```bash
rp init dev frontend-app
rp init dev backend-api
rp init dev data-pipeline
```

### Q: 删除项目怎么做？

直接删除项目目录，然后从注册表移除：

```bash
rm -rf ~/Projects/my-app
rp unregister my-app
```

### Q: framework/ 不小心被修改了怎么办？

`framework/` 是符号链接，指向 RayPrism 框架本体中的分支目录。如果被修改，其他使用同分支的项目也会受影响。恢复方法：

```bash
cd /path/to/RayPrism
git checkout branches/  # 恢复框架文件
```

### Q: 初始化后还需要安装其他东西吗？

不需要。`rp init` 已完成所有配置。打开 Cursor / VS Code 即可开始工作。

如果分支的 `post-init.sh` 中定义了额外逻辑（如 `npm init`），会在初始化时自动执行。

### Q: 如何自定义 post-init 行为？

编辑框架中对应分支的 `post-init.sh`：

```bash
# 例如让 dev 分支自动初始化 npm
vim /path/to/RayPrism/branches/dev/post-init.sh
```

> ⚠️ 注意：这会影响所有后续使用该分支创建的项目。

---

## 命令速查表

| 命令 | 说明 | 示例 |
|------|------|------|
| `rp help` | 查看帮助 | `rp help` |
| `rp list` | 列出可用分支（含版本号） | `rp list` |
| `rp init <branch> <name>` | 初始化新项目 | `rp init dev my-app` |
| `rp init ... --git` | 初始化 + Git | `rp init dev my-app --git` |
| `rp init ... --path /dir` | 指定项目路径 | `rp init dev my-app --path ~/Work/my-app` |
| `rp projects` | 列出所有已注册项目 | `rp projects` |
| `rp unregister <name>` | 从注册表移除 | `rp unregister old-project` |
| `rp status` | 查看当前项目信息 | `cd my-app && rp status` |
| `rp upgrade` | 升级框架到最新版本 | `cd my-app && rp upgrade` |
