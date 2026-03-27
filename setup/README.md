# RayPrism · 使用手册

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

- Node.js ≥ 18

### 方式一：npx（免安装，推荐尝鲜）

```bash
npx rayprism help
```

### 方式二：全局安装（长期使用）

```bash
npm install -g rayprism
rayprism help
```

预期输出:

```
rayprism — Multi-branch AI Agent Framework

命令：
  rayprism init <branch> <name> [--path /dir]            初始化新项目
  rayprism list                                          列出可用分支
  rayprism projects                                      列出所有已注册项目
  rayprism status                                        查看当前项目信息
  rayprism upgrade                                       更新框架符号链接
  rayprism unregister <name>                             从注册表移除项目

分支: pro | ink | dev | ops
```

---

## 2. 查看可用分支

```bash
rayprism list
```

输出:

```
📦 RayPrism 可用分支
══════════════════════════════════
  ● pro v0.1.0       专业文档 / 策略规划 / 分析报告
  ● ink v0.1.0       内容创作 / 公众号 / 社媒运营
  ● dev v0.1.0       软件开发 / 代码 / 架构设计
  ● ops v0.1.0       运维 / 自动化 / 系统管理

用法: rayprism init <branch> <project-name>
```

### 分支选择指南

| 场景 | 选择分支 | 主力 Skills |
|------|---------|-------------|
| 写分析报告、策略文档、Obsidian 知识管理 | `pro` | obsidian-markdown, obsidian-bases, json-canvas |
| 写公众号文章、小红书内容、社媒运营 | `ink` | ray-content-wechat-generating, ray-multi-party-mode |
| 写代码、做架构设计、开发应用 | `dev` | ray-util-antigravity-bridging, vercel-react-best-practices |
| 系统运维、巡检排障、自动化脚本 | `ops` | agent-browser, tavily-search |

---

## 3. 初始化项目

### 基础用法

```bash
rayprism init <branch> <project-name>
```

项目会创建在 `~/Projects/<project-name>/`：

```bash
# 示例: 创建一个开发项目
rayprism init dev my-saas-app
```

### 指定路径

```bash
rayprism init ink my-blog --path ~/Work/my-blog
```

### 完整初始化流程（背后发生了什么）

```
rayprism init dev my-app
```

执行步骤：

| 步骤 | 操作 | 产物 |
|------|------|------|
| ① | 下载模板（首次） | `~/.rayprism/framework/` |
| ② | 创建项目目录 | `~/Projects/my-app/` |
| ③ | 创建 `framework/` 符号链接 | 指向缓存中的 `branches/dev/`（只读） |
| ④ | 创建 `overrides/` 目录 | `overrides/rules/` + `overrides/skills/` |
| ⑤ | 逐文件链接 `.agents/skills/` | 框架 skills + overrides 合并 |
| ⑥ | 逐文件链接 `.claude/rules/` | 框架 rules + overrides 合并 |
| ⑦ | 链接 `CLAUDE.md` | 指向 `framework/` 下的同名文件 |
| ⑧ | 创建 `workspace/` 目录结构 | 分支专属子目录 |
| ⑨ | 生成 `AGENTS.md` | AI 工具配置（含只读声明 + 覆盖说明） |
| ⑩ | 写入 `.rayprism.json` | 项目元信息（名称、分支、版本） |
| ⑪ | 注册到全局注册表 | `~/.rayprism/registry.json` |
| ⑫ | 执行 post-init hook | `branches/dev/post-init.sh` |

---

## 4. 理解项目目录结构

以 `rayprism init dev my-app` 为例（dev 分支）：

```
my-app/
├── .rayprism.json          ← 项目元信息
├── .gitignore              ← 排除框架链接
├── AGENTS.md               ← AI 工具配置（自动生成）
├── CLAUDE.md  → framework/ ← 符号链接
│
├── framework/  → ~/.rayprism/framework/branches/dev（只读🔒）
│   ├── AGENTS.md
│   ├── VERSION
│   ├── .agents/skills/     ← 分支自带 Skills
│   └── .claude/rules/      ← 分支自带规则
│
├── .agents/skills/          ← 合并视图（框架 + overrides）
├── .claude/rules/           ← 合并视图（框架 + overrides）
│
├── overrides/               ← ✏️ 项目级自定义（可写）
│   ├── rules/
│   └── skills/
│
└── workspace/               ← 📁 所有 AI 产出（可写）
    ├── src/ docs/ tests/
    ├── artifacts/ experiments/
    └── README.md
```

### 三种文件类型

| 类型 | 标记 | 说明 |
|------|------|------|
| 🔒 只读 | `framework/`、`🔗` 链接 | 来自框架模板，禁止修改，用 `rayprism upgrade` 更新 |
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
EOF
```

运行 `rayprism upgrade` 后，该规则会自动合并到 `.claude/rules/code-style.md`。

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

运行 `rayprism upgrade` 后，该 Skill 会自动出现在 `.agents/skills/my-deploy-skill/`。

### 覆盖框架规则

如果在 `overrides/rules/` 中放置与框架同名的文件，本地版本优先：

```bash
# 覆盖框架自带的 diagram-communication.md
cp framework/.claude/rules/diagram-communication.md overrides/rules/
# 编辑你的自定义版本
rayprism upgrade  # 重新合并，本地优先
```

---

## 6. 管理多个项目

### 列出所有项目

```bash
rayprism projects
```

输出：

```
📋 RayPrism 已注册项目 (3)
══════════════════════════════════════════════════════
  ● my-saas-app          dev      v0.1.0  /Users/ray/Projects/my-saas-app
  ● my-blog              ink      v0.1.0  /Users/ray/Work/my-blog
  ○ deleted-project      pro      v0.1.0  /Users/ray/Projects/deleted-project
```

- `●` = 目录存在（存活）
- `○` = 目录已删除

### 从注册表移除项目

```bash
rayprism unregister deleted-project
```

> 仅从注册表移除，**不会删除项目目录**。

---

## 7. 查看项目状态

在项目目录内运行：

```bash
cd ~/Projects/my-app
rayprism status
```

输出：

```
📋 RayPrism 项目信息
══════════════════════════════════
  项目名称 : my-app
  分支类型 : dev
  框架来源 : ~/.rayprism/framework/branches/dev
  模板版本 : 0.1.0
  创建时间 : 2026-03-27T11:10:13Z

  模板版本 : v0.1.0 ✅ 已是最新

  framework/ → ~/.rayprism/framework/branches/dev
  overrides/  规则: 1, Skills: 0
```

---

## 8. 升级框架版本

当 RayPrism 框架发布新版本后，在项目目录内运行：

```bash
cd ~/Projects/my-app
rayprism upgrade
```

输出：

```
ℹ️  正在从 GitHub 下载 RayPrism 模板...
✅ 模板下载完成 → ~/.rayprism/framework/
ℹ️  版本变更: v0.1.0 → v0.2.0
ℹ️  重新链接 framework → ~/.rayprism/framework/branches/dev
✅ 链接 .agents/skills/（框架 + 覆盖合并）
✅ 链接 .claude/rules/（框架 + 覆盖合并）
✅ 模板版本已更新为 v0.2.0
✅ 框架已更新至最新版本
```

`rayprism upgrade` 做的事情：
1. 从 GitHub 重新下载最新模板
2. 重新链接 `framework/` 符号链接
3. 重新执行 `.agents/skills/` 和 `.claude/rules/` 的合并（保留 overrides）
4. 更新 `.rayprism.json` 中的版本号
5. 更新全局注册表

---

## 9. 四个分支的目录结构对比

所有分支的项目结构框架相同，区别在于 **workspace 子目录** 和 **Skills/Rules 内容**：

### workspace/ 子目录

| 分支 | workspace/ 子目录 |
|------|-------------------|
| **pro** | `reports/` `strategy/` `analysis/` `drafts/` `references/` |
| **ink** | `drafts/` `published/` `assets/` `scheduled/` `archive/` |
| **dev** | `src/` `docs/` `tests/` `artifacts/` `experiments/` |
| **ops** | `scripts/` `configs/` `runbooks/` `logs/` `incidents/` |

### .agents/skills/ 内容

| 分支 | 自带 Skills |
|------|------------|
| **pro** | obsidian-markdown, obsidian-bases, json-canvas |
| **ink** | ray-content-wechat-generating, ray-multi-party-mode, ray-role-creator |
| **dev** | get-code-context-exa, ray-util-antigravity-bridging, tavily-search, vercel-react-best-practices |
| **ops** | agent-browser, tavily-search |

### .claude/rules/ 内容

| 分支 | 自带规则文件 |
|------|-------------|
| **pro** | diagram-communication.md, discussion-tracking.md |
| **ink** | content-style.md, diagram-communication.md, discussion-tracking.md |
| **dev** | dev-contract.md, diagram-communication.md, discussion-tracking.md |
| **ops** | ops-runbook.md, diagram-communication.md, discussion-tracking.md |

---

## 10. 常见问题

### Q: 我可以同时有多个同类型分支的项目吗？

**可以**。每个 `rayprism init` 创建独立的项目目录，互不干扰：

```bash
rayprism init dev frontend-app
rayprism init dev backend-api
rayprism init dev data-pipeline
```

### Q: 删除项目怎么做？

直接删除项目目录，然后从注册表移除：

```bash
rm -rf ~/Projects/my-app
rayprism unregister my-app
```

### Q: framework/ 不小心被修改了怎么办？

`framework/` 是符号链接，指向 `~/.rayprism/framework/` 中的缓存模板。运行 `rayprism upgrade` 即可重新下载并恢复。

### Q: 初始化后还需要安装其他东西吗？

不需要。`rayprism init` 已完成所有配置。打开 Cursor / VS Code 即可开始工作。

### Q: 模板缓存在哪里？

`~/.rayprism/framework/` — 首次运行时从 GitHub 自动下载，后续使用缓存。运行 `rayprism upgrade` 可强制更新。

---

## 命令速查表

| 命令 | 说明 | 示例 |
|------|------|------|
| `rayprism help` | 查看帮助 | `rayprism help` |
| `rayprism list` | 列出可用分支 | `rayprism list` |
| `rayprism init <branch> <name>` | 初始化新项目 | `rayprism init dev my-app` |
| `rayprism init ... --path /dir` | 指定路径 | `rayprism init dev my-app --path ~/Work/app` |
| `rayprism projects` | 列出所有项目 | `rayprism projects` |
| `rayprism unregister <name>` | 从注册表移除 | `rayprism unregister old-project` |
| `rayprism status` | 查看当前项目 | `cd my-app && rayprism status` |
| `rayprism upgrade` | 升级框架 | `cd my-app && rayprism upgrade` |
