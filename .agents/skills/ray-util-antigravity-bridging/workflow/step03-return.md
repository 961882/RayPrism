# Step 03: 结果返回

> 执行者：主Agent
> 输入：`state/` `output/`
> 输出：`-`（只读取落盘结果，不产生新目录）

## 执行说明

桥成功时直接返回 `output/output.txt`；桥失败时返回 `state/state.json` 与 `step02-execute/error.log` 的路径和摘要，不额外润色 bridge 的原始结果。

## 输入文件

- `runs/{run-id}/state/state.json`
- `runs/{run-id}/output/output.txt`
- `runs/{run-id}/step02-execute/error.log`

## 输出文件

- `runs/{run-id}/output/output.txt`

## 脚本执行 / Agent Prompt

无需额外脚本，直接读取落盘结果。

## 验证检查点

- 成功时 `output/output.txt` 存在且非空
- 失败时 `state/state.json` 和 `step02-execute/error.log` 至少存在一个
- `state.json` 可解析且包含 `status` 字段（值为 `success` 或 `error`）

## 下一步

结束流程
