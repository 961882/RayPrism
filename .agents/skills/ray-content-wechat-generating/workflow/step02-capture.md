# Step 02: 灵感捕获

> 执行者：主 Agent
> 输入：用户提供的链接/原文 + `state/config.json`
> 输出：`step02-capture/`

## 执行说明

从用户提供的素材中提炼核心信息。

## 提炼清单

从输入中提取以下 5 项，逐项落盘：

1. **核心观点**（1-2 句）：文章要传达的主张
2. **支撑证据**（≥2 条）：数据、案例、对比
3. **受众痛点**（≥2 条）：目标读者的具体卡点
4. **可借鉴结构**：原文的组织方式（问题-方案 / 对比 / 清单 / 案例）
5. **一手经验标记**：哪些内容来自作者亲历，哪些是二手引用

## 输出文件

`{run_dir}/step02-capture/insight.json`：

```json
{
  "core_thesis": "",
  "evidence": [],
  "pain_points": [],
  "structure_type": "",
  "first_hand": [],
  "second_hand": []
}
```

## 验证检查点

- `insight.json` 存在且 JSON 可解析
- `core_thesis` 非空
- `evidence` ≥ 2 条
- `pain_points` ≥ 2 条

## 下一步

→ Step 03（选题出稿）
