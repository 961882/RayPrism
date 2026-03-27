# Step 02: 桥接执行

> 执行者：脚本
> 输入：`runs/{run-id}/config.json`
> 输出：`step02-execute/`

## 执行说明

调用内置的 Node bridge 执行 `run / check / kill / config`。`run` 模式下优先尝试 `serve`，失败时回退 `ui`，并把关键运行产物写入本次 `runs/{run-id}/`。

## 输入文件

- `runs/{run-id}/config.json`

## 输出文件

- `runs/{run-id}/state/state.json`
- `runs/{run-id}/step02-execute/prompt.txt`
- `runs/{run-id}/step02-execute/error.log`
- `runs/{run-id}/output/output.txt`

## 脚本执行 / Agent Prompt

- `bash scripts/bridge-run.sh --prompt "<prompt>"`
- `bash scripts/bridge-check.sh --run <run-id>`
- `bash scripts/bridge-kill.sh --run <run-id>`

## 验证检查点

- 命令退出状态符合预期
- `state/state.json` 已更新
- 需要授权时，允许桥自动处理 `Allow This Conversation`

## 下一步

进入 `workflow/step03-return.md`
