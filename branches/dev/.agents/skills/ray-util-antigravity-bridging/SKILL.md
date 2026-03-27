---
name: ray-util-antigravity-bridging
description: 通过可迁移的本地 TypeScript bridge 调用 Antigravity，并提供 run、check、kill、config、serve/ui 回退与运行结果落盘。当用户说「走桥」「通过 bridge 调用 Antigravity」「检查 bridge 运行」「停止 bridge run」时触发。
allowed-tools:
  - Read
  - Bash
---

# Ray Antigravity Bridging

把 Antigravity 的一次调用封装成一个可追踪、可检查、可终止、可迁移的本地任务流程。

## 目录

1. [触发条件](#触发条件)
2. [执行模式](#执行模式)
3. [执行规范](#执行规范必须遵守)
4. [工作流](#工作流3-步)
5. [数据流](#数据流)
6. [上下文管理](#上下文管理)
7. [参考资料](#参考资料)
8. [凭证](#凭证)

---

## 触发条件

| 关键词 | 动作 |
|--------|------|
| 「走桥」「通过 bridge 调用 Antigravity」「bridge 运行」 | 执行完整桥接流程 |
| 「检查 bridge」「查看 bridge 配置」 | 查看当前配置或运行状态 |
| 「停止 bridge」「kill bridge run」 | 终止指定运行 |

---

## 执行模式

| 选项 | 说明 |
|------|------|
| ✅ 自动执行 | 按 `config/default.json` 与用户参数执行桥接流程 |

---

## 执行规范（必须遵守）

1. **先读后做**：执行前先读 `config/default.json` 和对应 `workflow/stepNN-*.md`
2. **路径优先**：传给 bridge 的文件参数优先使用绝对路径；bridge 会按 `workspaceRoot` 把工作区内路径改写成 `./相对路径`，减少目录授权弹窗
3. **结果直返**：桥成功时，直接返回 `runs/.../output/output.txt` 内容，不做二次改写
4. **失败可查**：桥失败时，优先报告 `state/state.json` 和 `step02-execute/error.log`
5. **不跳步骤**：按 01 → 02 → 03 顺序执行，保留运行产物

---

## 工作流（3 步）

| Step | 职责 | 执行者 | 文档 | 输入 | 输出 |
|------|------|--------|------|------|------|
| 01 | 参数初始化 | 主Agent | `workflow/step01-init.md` | 用户触发 | `state/` |
| 02 | 桥接执行 | 脚本 | `workflow/step02-execute.md` | `runs/{run-id}/config.json` | `step02-execute/` |
| 03 | 结果返回 | 主Agent | `workflow/step03-return.md` | `state/` `output/` | `-` |

---

## 数据流

`用户请求` → `Step 01 初始化` → `runs/{run-id}/state/`

`state/ + config/default.json` → `Step 02 执行桥接` → `runs/{run-id}/step02-execute/`

`state/ + output/` → `Step 03 返回结果` → `runs/{run-id}/output/`

---

## 上下文管理

| 规则 | 说明 |
|------|------|
| 按步读取 | 只在执行到当前步骤时读取对应 `workflow/*.md` |
| 不预读全部 | 不一次性加载所有步骤和代码 |
| 运行持久化 | 每次运行都落到 `runs/{keyword}-{timestamp}/` |
| 极简返回 | 成功返回桥输出，失败返回错误路径和摘要 |

---

## 参考资料

| 文件 | 路径 | 用途 |
|------|------|------|
| 默认配置 | `config/default.json` | 运行参数默认值（连接、输出、超时） |
| 参数描述 | `config/params.schema.json` | 字段分组、类型和含义说明 |
| 安全策略 | `reference/definitions/security-policy.json` | 自动授权开关，修改前确认安全影响 |
| 桥执行代码 | `scripts/bridge/src/` | TypeScript 执行入口、serve/ui 回退、CDP 读写 |

---

## 凭证

本 Skill 不内置凭证文件；依赖本机可用的 `opencli`、Antigravity 桌面应用和 `OPENCLI_CDP_ENDPOINT`。
https://github.com/jackwener/opencli

