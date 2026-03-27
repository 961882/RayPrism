---
name: ray-content-wechat-generating
description: |
  微信公众号内容生成流水线 Skill。将灵感或关键词经五阶段流水线（灵感→选题→大纲→初稿→终稿）处理，自动检查文案质量（AI 痕迹、旁白句式、结构完整、转化闭环），产出可直接发布的公众号文章。
  融合 social-writer 的去 AI 痕迹规则、钩子模式、文风指南，确保内容像真人写的。
  当用户说「公众号文案」「公众号最终稿」「按工作流写」「内容工厂」「A/B标题」「直接出稿」「一键出稿」时触发。
---

# 公众号内容生成

从灵感/关键词到可发布终稿的标准流水线，内置去 AI 痕迹检查和转化闭环。

---

## 目录

1. [触发条件](#触发条件)
2. [执行模式](#执行模式)
3. [执行规范](#执行规范)
4. [工作流](#工作流)
5. [数据流](#数据流)
6. [Quick 模式（一键出稿）](#quick-模式一键出稿)
7. [文风规则](#文风规则)
8. [自动检查](#自动检查)
9. [上下文管理](#上下文管理)
10. [参考资料](#参考资料)
11. [转化与回退](#转化与回退)

---

## 触发条件

| 关键词 | 动作 |
|--------|------|
| 「公众号文案」「内容工厂」 | 执行完整五阶段流程（full 模式） |
| 「直接出稿」「一键出稿」「按工作流写」 | 跳过灵感/选题/大纲，直接出稿（quick 模式） |
| 「A/B 标题」「公众号最终稿」 | 从现有素材生成终稿 |

---

## 执行模式

| 模式 | 步骤 | 适用场景 |
|------|------|----------|
| **full** | 01→02→03→04→05 | 有链接/原文，需完整选题流程 |
| **quick** | 01→04→05 | 只给关键词，快速出稿 |

默认：用户给链接/原文 → full；只给关键词 → quick。

---

## 执行规范（必须遵守）

1. **先读后做**：执行 Step N 前，先读 `workflow/stepN-*.md`
2. **逐步验证**：每步完成后检查输出是否符合预期
3. **不跳步骤**：按数字顺序执行（quick 模式跳过 02/03 除外）
4. **写前读规则**：Step 04 执行前必须读 `reference/ai-avoidance.md`、`reference/hooks.md`、`reference/style-guide.md`，并读取 `state/config.json` 中的 `style_profile` 字段，加载对应的 `reference/style-profiles/{profile}.md`
5. **进度持久化**：维护 `state/progress.json` 支持断点恢复

---

## 工作流

### Full 模式（5 步）

| Step | 职责 | 执行者 | 文档 | 输入 | 输出 |
|------|------|--------|------|------|------|
| 01 | 初始化 | 主Agent | `workflow/step01-init.md` | 用户触发 | `state/` |
| 02 | 灵感捕获 | 主Agent | `workflow/step02-capture.md` | 链接/原文 | `step02-capture/` |
| 03 | 选题大纲 | 主Agent | `workflow/step03-outline.md` | step02-capture/ | `step03-outline/` |
| 04 | 初稿生成 | SubAgent | `workflow/step04-draft.md` | step03-outline/ | `step04-draft/` |
| 05 | 终稿检查 | 脚本+主Agent | `workflow/step05-finalize.md` | step04-draft/ | `output/` |

### Quick 模式（3 步）

| Step | 职责 | 执行者 | 文档 | 输入 | 输出 |
|------|------|--------|------|------|------|
| 01 | 初始化 | 主Agent | `workflow/step01-init.md` | 用户触发 | `state/` |
| 04 | 初稿生成 | SubAgent | `workflow/step04-draft.md` | config | `step04-draft/` |
| 05 | 终稿检查 | 脚本+主Agent | `workflow/step05-finalize.md` | step04-draft/ | `output/` |

---

## 数据流

### Full 模式

```
用户输入（链接/原文）
  → Step 01: 初始化 → state/
  → Step 02: 灵感捕获 → step02-capture/insight.json
  → Step 03: 选题大纲 → step03-outline/{topics,outlines}.json
  → Step 04: 初稿生成 → step04-draft/{draft.md,meta.json}
  → Step 05: 终稿检查 → output/{final.md,check-result.json}
```

### Quick 模式

```
用户输入（关键词）
  → Step 01: 初始化 → state/config.json
  → Step 04: 初稿生成 ← config → step04-draft/{draft.md,meta.json}
  → Step 05: 终稿检查 → output/{final.md,check-result.json}
```

---

## Quick 模式（一键出稿）

当用户只给关键词时，按以下输入卡执行：

| 字段 | 默认值 |
|------|--------|
| 关键词 | 用户提供 |
| 目标读者 | 想尝鲜/想落地的实操人群 |
| 发布渠道 | 公众号 |
| 转化目标 | 回复"部署"领取资料 |

### 固定产出结构

1. **标题 5 个**：流量向 2 + 转化向 2 + 稳健向 1
2. **开头钩子 2 版**（80-150 字）：版 A 痛点直击 / 版 B 结果承诺
3. **正文**（可直接发布）：结论先行 + 步骤化，含 4 个价值最小单元
4. **结尾 CTA 2 版**：轻转化（回复关键词）/ 强转化（咨询/进群）
5. **自动检查**：按检查规则输出通过/不通过

---

## 文风规则

### Style Profile（文风档位）

每次运行选定一个 Profile，写入 `state/config.json`，后续所有步骤和 auto-check 均读取此字段。

| Profile | 适用选题类型 | 核心差异 |
|---------|----------|----------|
| `practical`（默认） | 工具教程、踩坑记录、配置指南 | 短句/禁破折号/第一人称/禁修辞 |
| `narrative` | 架构思路、产品叙事、IP 故事 | 长句/允许破折号/第三人称/贯穿隐喻 |

AI 禁用词（`reference/ai-avoidance.md`）为两个 Profile 共享的底线，不随 Profile 变化。

### 其他规则

禁旁白、必给动作、不夸大、去 AI 味。执行 Step 04 前必须读 `reference/ai-avoidance.md`。

详细写作规范见 `workflow/step04-draft.md` §写作规范。

### 转化闭环（强制）

终稿必须含"看完下一步"：回复关键词 / 领取资料 / 加入私域。无明确下一步动作 → 不通过。

---

## 自动检查

Step 05 执行 `scripts/auto-check.mjs --profile <style_profile>`，从 `state/config.json` 读取 profile 字段传入。检查项：结构完整、旁白句式、AI 禁用词、破折号（practical 判 fail / narrative 仅 warning）、CTA 关键词、可执行动作 ≥3、A/B 标题。

详细规则见 `workflow/step05-finalize.md`。不通过 → 修正后重检。

---

## 上下文管理

| 规则 | 说明 |
|------|------|
| 分批执行 | 每轮最多 2 个 Agent，等待完成后再启动下一轮 |
| 强制压缩 | 每轮完成后 `/compact` |
| 极简返回 | Agent 只返回 `{"ok": true}`，不返回文件内容 |
| 进度持久化 | 维护 `state/progress.json` 支持断点恢复 |

---

## 参考资料

| 文件 | 路径 | 用途 | 何时读取 |
|------|------|------|----------|
| AI 痕迹去除 | `reference/ai-avoidance.md` | 禁用词、禁用句式、结构规则 | Step 04 执行前 |
| 钩子模式 | `reference/hooks.md` | 开头钩子的 6 种模式与示例 | Step 04 执行前 |
| 文风指南 | `reference/style-guide.md` | 语气、排版、具体化规则 | Step 04 执行前 |
| 实操干货 Profile | `reference/style-profiles/practical.md` | 短句/禁破折号/第一人称约束 | Step 04 执行前（profile = practical）|
| 叙事散文 Profile | `reference/style-profiles/narrative.md` | 长句/允许破折号/隐喻体系约束 | Step 04 执行前（profile = narrative）|
| 风格参考样本 | `reference/style-samples/` | 用户提供的参考文章 + 自动提炼的风格摘要 `_index.md` | Step 04 执行前（若 `_index.md` 存在） |
| 默认配置 | `config/default.json` | 默认参数（读者、CTA、标题数、style_profile） | Step 01 初始化时 |
| 检查脚本 | `scripts/auto-check.mjs` | 终稿自动检查 | Step 05 执行时 |

## 转化与回退

### 默认 CTA

- 回复「部署」领取《OpenClaw 部署对比 PDF》
- 回复「代搭」查看远程部署与安全优化服务

可在 `config/default.json` 中自定义。

### 失败回退

素材不足导致内容空泛时，先生成「素材采集清单」：

- 必要事实 5 条（场景、成本、时间、工具、结果）
- 最小案例 1 条（前后对比）
- 读者常见问题 5 条

采集后二次出稿。
