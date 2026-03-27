# Step 01: 初始化

> 执行者：主 Agent
> 输入：用户触发（关键词 / 链接 / 原文）
> 输出：`state/`

## 执行说明

收集本次运行所需参数，创建 run 目录。

### run 目录命名

```
{mode}-{keyword}-YYYYMMDD-HHMMSS
```

示例：
- `full-mcp部署-20260325-150000`
- `quick-agent-setup-20260325-160000`

中文关键词可直接用于目录名。

## 参数收集

根据用户输入确定以下字段：

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `keyword` | 用户提供 | 文章关键词/方向 |
| `target_reader` | 想尝鲜/想落地的实操人群 | 目标读者 |
| `channel` | 公众号 | 发布渠道 |
| `conversion_goal` | 回复"部署"领取资料 | 转化目标 |
| `materials` | 空 | 经验、案例、数据、截图 |
| `mode` | full | full（五阶段）/ quick（一键出稿）|
| `style_profile` | `practical` | 文风档位：`practical`（实操干货体）或 `narrative`（叙事散文体）|

**模式判断**：
- 用户提供链接/原文 → `full`
- 用户只给关键词，说"直接出稿""一键" → `quick`
- 不确定 → 询问用户

**Profile 判断**：
- 用户明确说"叙事""散文""第三人称"或选题类型为架构/产品/IP 故事 → `narrative`
- 其他情况（教程/踩坑/配置/评测）→ `practical`（默认）
- Profile 在 Step 01 确定后写入 config，**后续步骤不可更改**

## 输出文件

`{run_dir}/state/config.json`：

```json
{
  "keyword": "",
  "target_reader": "",
  "channel": "公众号",
  "conversion_goal": "",
  "materials": [],
  "mode": "full",
  "style_profile": "practical",
  "created_at": ""
}
```

`{run_dir}/state/progress.json`：

```json
{
  "mode": "full",
  "current_step": 1,
  "total_steps": 5,
  "status": "initialized",
  "恢复提示": "Full 模式，Step 1/5，初始化完成"
}
```

> `total_steps` 随模式变化：full = 5，quick = 3。
> `恢复提示` 每步更新，中断后可快速了解上次进度。

## 验证检查点

- `state/config.json` 存在且 JSON 可解析
- `keyword` 非空
- `mode` 为 `full` 或 `quick`
- `style_profile` 为 `practical` 或 `narrative`

## 下一步

- `full` → Step 02（灵感捕获）
- `quick` → Step 04（初稿打磨，跳过灵感/选题/大纲）
