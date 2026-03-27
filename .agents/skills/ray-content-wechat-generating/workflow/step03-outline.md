# Step 03: 选题与大纲

> 执行者：主 Agent
> 输入：`step02-capture/insight.json` + `state/config.json`
> 输出：`step03-outline/`

## 执行说明

基于灵感提炼结果，生成选题和大纲供用户选择。

## 选题生成（3 个）

| 类型 | 目标 | 标题方向 |
|------|------|----------|
| 流量向 | 高点击、高传播 | 反常识 / 踩坑 / 清单 |
| 转化向 | 引导行动 | 教程 / 对比 / 方案 |
| 稳健向 | 专业信任 | 深度分析 / 经验复盘 |

每个选题须写明：
- 目标读者
- 收益承诺（读完能得到什么）
- 预期结构

## 大纲生成（3 套）

为用户选定的选题提供 3 套大纲结构：

1. **问题-方案**：痛点 → 原因分析 → 解决步骤 → 结果
2. **对比决策**：选项对比 → 优劣分析 → 推荐理由
3. **案例拆解**：场景 → 做法 → 踩坑 → 改进 → 结果

各大纲须包含：
- 开头钩子方向
- 3-5 个正文段落的核心论点
- CTA 方向

## 用户确认

输出 3 套大纲后等待用户确认，用户选定 1 套进入 Step 04。

## 输出文件

`{run_dir}/step03-outline/topics.json`：

```json
{
  "topics": [
    {"type": "流量向", "title_direction": "", "target_reader": "", "benefit": "", "structure": ""},
    {"type": "转化向", "...": "..."},
    {"type": "稳健向", "...": "..."}
  ],
  "selected_topic": null
}
```

`{run_dir}/step03-outline/outlines.json`：

```json
{
  "outlines": [
    {"type": "问题-方案", "hook": "", "sections": [], "cta_direction": ""},
    {"type": "对比决策", "...": "..."},
    {"type": "案例拆解", "...": "..."}
  ],
  "selected_outline": null
}
```

## 验证检查点

- `topics.json` 含 3 个选题
- `outlines.json` 含 3 套大纲
- 用户已确认选定

## 下一步

→ Step 04（初稿打磨）
