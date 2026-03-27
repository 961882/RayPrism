# Step 05: 终稿检查与定版

> 执行者：脚本 + 主 Agent
> 输入：`step04-draft/`
> 输出：`output/`

## 执行说明

运行自动检查脚本，判定是否通过。通过后复制到 `output/`，不通过则修正后重检。

## 自动检查

执行 `scripts/auto-check.mjs`：

```bash
node {skill_dir}/scripts/auto-check.mjs {run_dir}/step04-draft/draft.md
```

### 检查项

| 检查项 | 规则 |
|--------|------|
| 结构完整 | 标题 / 开头 / 正文 / CTA 四块都有 |
| 旁白句式 | 出现即不通过 |
| CTA 关键词 | 含「部署」「代搭」或用户自定义关键词 |
| 可执行动作 | ≥ 3 条 |
| A/B 标题 | 有可对比的标题组 |
| AI 禁用词 | 零命中 |
| 破折号 | 零出现 |

### 检查结果处理

- **通过**：复制 `draft.md` → `output/final.md`，输出自检报告
- **不通过**：输出失败原因，回退 Step 04 修正，重新检查

## 输出文件

`{run_dir}/output/final.md`：可直接发布的终稿

`{run_dir}/output/check-result.json`：自检报告

## 验证检查点

- `check-result.json` 中 `pass` = `true`
- `final.md` 存在且与 `draft.md` 内容一致（或含修正）
- 转化闭环存在（CTA + 下一步动作）

## 失败回退

若素材不足导致内容空泛，生成「素材采集清单」：

- 必要事实 5 条（场景、成本、时间、工具、结果）
- 最小案例 1 条（前后对比）
- 读者常见问题 5 条

交用户补充后二次出稿。

## 下一步

流程结束。向用户交付：
1. 终稿文本
2. 自检报告
3. 标题 A/B 对比建议
