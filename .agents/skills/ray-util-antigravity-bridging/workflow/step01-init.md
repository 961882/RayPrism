# Step 01: 参数初始化

> 执行者：主Agent
> 输入：`用户请求`
> 输出：`state/`

## 执行说明

读取 `config/default.json`，判断本次是 `run`、`check`、`kill` 还是 `config`，并确认本次运行是否需要覆盖 `workspaceRoot`、`transport`、`timeoutMs` 等参数。

## 输入文件

- `config/default.json`

## 输出文件

- `runs/{run-id}/state/state.json`
- `runs/{run-id}/config.json`

## 脚本执行 / Agent Prompt

优先使用 `bash scripts/bridge-config.sh` 查看生效配置；需要执行时再调用 `bridge-run.sh`、`bridge-check.sh`、`bridge-kill.sh`。

## 验证检查点

- `config/default.json` 可解析（JSON 格式有效）
- 本次动作已明确（`run` / `check` / `kill` / `config` 之一）
- 若用户显式给出工作区，`workspaceRoot` 覆盖值已明确
- `runs/{run-id}/state/state.json` 已写入且存在
- `runs/{run-id}/config.json` 已写入且存在

## 下一步

进入 `workflow/step02-execute.md`
