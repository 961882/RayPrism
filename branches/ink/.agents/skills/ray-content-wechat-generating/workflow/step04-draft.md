# Step 04: 初稿生成

> 执行者：SubAgent
> 输入：`step03-outline/` 或 `state/config.json`（quick 模式）
> 输出：`step04-draft/`
> 允许工具：Read, Write

## 执行说明

生成可直接发布的初稿。执行前必须读取：
- `reference/ai-avoidance.md` — 去 AI 味道（共享底线，两个 Profile 都遵守）
- `reference/hooks.md` — 开头钩子模式
- `reference/style-profiles/{profile}.md` — 按 `config.json` 中的 `style_profile` 读取对应约束
- `reference/style-samples/_index.md` — 用户风格参考摘要（若文件存在）

> `style-guide.md` 为旧版通用指南，仍可参考。Profile 文件的约束优先级高于 style-guide.md。

### 输入来源（按模式）

| 模式 | 读取 | 内容 |
|------|------|------|
| **full** | `step03-outline/outlines.json` | 用户选定的大纲结构 |
| **quick** | `state/config.json` | 关键词 + 目标读者 + 转化目标 |

Quick 模式下无大纲，直接根据 config 中的关键词生成完整文稿。

## 写作规范

### 文风规则

- **禁旁白**：不写"本文将""这里不讲""接下来我们"
- **必给动作**：不空谈方法论
- **短句优先**：不堆长句，段落 ≤ 3 句
- **不夸大**：避免绝对化词汇

### AI 痕迹去除（强制）

执行前读 `reference/ai-avoidance.md`，重点检查：

- 零禁用词（delve / unleash / harness / leverage / robust / seamless 等）
- 零破折号（—）
- 不用"本文将" "值得注意的是" "总而言之"
- 句长变化：短句（5 词）与长句（30+ 词）交替
- 必须有作者立场和个人观点

### 内容结构（结论先行 + 步骤化）

正文必须包含「价值最小单元」：

| 要素 | 要求 |
|------|------|
| 真实问题场景 | ≥ 1 个 |
| 可执行动作 | ≥ 3 条 |
| 反例或踩坑 | ≥ 1 个 |
| 可验证结果 | ≥ 1 个（时间 / 效率 / 成本 / 转化） |

### 标题生成

生成 5 个标题：

| 类型 | 数量 | 说明 |
|------|------|------|
| 流量向 | 2 | 反常识 / 数据 / 清单 |
| 转化向 | 2 | 方案 / 教程 / 对比 |
| 稳健向 | 1 | 专业深度 |

标题改写规则：只借结构，不照搬。必须同时替换场景、痛点、收益承诺。

可用模板：
- 你做不好 X，不是不努力，而是 Y 错了
- 别再 X 了：给你一套可直接执行的 Y
- 从 0 到 1 做成 X：我用这 3 步跑通

### 钩子生成

生成 2 版开头钩子（80-150 字）：
- **版 A**：痛点直击
- **版 B**：结果承诺

写法参考 `reference/hooks.md`。

### CTA 生成

生成 2 版结尾 CTA：
- **轻转化**：回复关键词领资料
- **强转化**：咨询服务/进群

## 输出文件

`{run_dir}/step04-draft/draft.md`：完整文稿（标题 + 钩子 + 正文 + CTA）

`{run_dir}/step04-draft/meta.json`：

```json
{
  "titles": [],
  "hooks": {"a": "", "b": ""},
  "cta": {"light": "", "strong": ""},
  "value_unit": {
    "scenario": "",
    "actions": [],
    "pitfall": "",
    "result": ""
  }
}
```

## 验证检查点

- `draft.md` 存在且非空
- 标题 = 5 个
- 钩子 = 2 版
- CTA = 2 版
- 可执行动作 ≥ 3
- 无旁白句式
- 无 AI 禁用词

## 下一步

→ Step 05（终稿检查）
