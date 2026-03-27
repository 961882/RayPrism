# ray-util-antigravity-bridging

[English](README.md) | 中文

生产版 Antigravity bridge skill，用于把一次桥接调用封装成可追踪、可检查、可终止的本地任务。

## 亮点

- 通过 `opencli` 连接 Antigravity，并在 `serve` 与 `ui` 之间自动回退
- 每次运行都会落盘，便于追踪 `state`、`prompt`、`output` 与 `error`
- 支持 `workspaceRoot`，会把工作区内路径改写成相对路径，减少目录授权弹窗
- 支持自动批准常见交互，包括 `Run`、`Accept` 和 `Allow This Conversation`
- 提供稳定的 shell 入口，适合作为仓库级统一桥接入口

## 环境要求

- 已安装并可启动 Antigravity 桌面应用
- 已安装 `opencli`，且命令在 `PATH` 中可用
- Node.js ≥ 18 以及 `tsx`（通过 `cd scripts/bridge && npm install` 安装）
- 默认 CDP 地址为 `http://127.0.0.1:9224`

## 快速开始

前提：本 skill 已经安装完成。请将 `<SKILL_DIR>` 替换为实际的 skill 根目录。

```bash
cd <SKILL_DIR>
```

### 0. 安装前置依赖

**安装 `opencli`** — 本 skill 依赖 [opencli](https://github.com/jackwener/opencli) 通过 CDP 与 Antigravity 桌面应用通信。

```bash
npm install -g @jackwener/opencli
```

**安装 skill 的 Node.js 依赖：**

```bash
cd scripts/bridge && npm install && cd -
```

> 验证：运行 `opencli --help` 确认 `opencli` 已在 `PATH` 中可用。

1. 启动 Antigravity 调试端口。

```bash
/Applications/Antigravity.app/Contents/MacOS/Electron --remote-debugging-port=9224
```

2. 查看当前生效配置。

```bash
bash scripts/bridge-config.sh
```

3. 发送一个最小桥接请求。

```bash
bash scripts/bridge-run.sh --prompt "请只回复：桥已连通"
```

4. 如果需要，使用返回的 `run-id` 查询运行状态。

```bash
bash scripts/bridge-check.sh --run <run-id>
```

## 主要命令

| 目的 | 命令 |
|---|---|
| 查看配置 | `bash scripts/bridge-config.sh` |
| 发起桥接 | `bash scripts/bridge-run.sh --prompt "<prompt>"` |
| 检查状态 | `bash scripts/bridge-check.sh --run <run-id>` |
| 终止运行 | `bash scripts/bridge-kill.sh --run <run-id>` |

## 目录结构

```text
ray-util-antigravity-bridging/
├── SKILL.md
├── README.md / README.zh.md
├── config/
│   ├── default.json
│   └── params.schema.json
├── reference/definitions/
│   └── security-policy.json
├── scripts/
│   ├── bridge-run.sh
│   ├── bridge-check.sh
│   ├── bridge-kill.sh
│   ├── bridge-config.sh
│   ├── common.sh
│   └── bridge/src/
├── workflow/
├── docs/
│   ├── MANUAL.md
│   └── MANUAL.zh.md
└── runs/              （自动生成，已 gitignore）
```

## 关键配置

默认配置文件位于 `config/default.json`。

| 项目 | 作用 |
|---|---|
| `forceBridge` | 强制所有请求走 bridge |
| `strict` | bridge 失败时禁止本地兜底 |
| `transport` | 默认传输层，通常为 `auto` |
| `servePort` | `serve` 模式端口，默认 `8082` |
| `autoApproveRunCommands` | 自动点击 `Run` / `Accept` |
| `autoApproveAllowConversation` | 自动点击 `Allow This Conversation` |

常用环境变量覆盖：

| 环境变量 | 用途 |
|---|---|
| `AG_BRIDGE_WORKSPACE_ROOT` | 覆盖当前工作区根目录 |
| `AG_BRIDGE_TRANSPORT` | 强制使用 `auto` / `serve` / `ui` |
| `AG_BRIDGE_TIMEOUT_MS` | 覆盖超时时间 |
| `OPENCLI_CDP_ENDPOINT` | 覆盖 CDP 地址 |
| `OPENCLI_CDP_TARGET` | 覆盖 CDP 目标页 |

## 运行产物

每次运行都会写入 `runs/<run-id>/`：

```text
runs/<run-id>/
├── config.json
├── state/state.json
├── output/output.txt
└── step02-execute/
    ├── prompt.txt
    └── error.log
```

## 传输模式

- `auto`：默认推荐，先试 `serve`，失败再回退 `ui`
- `serve`：适合简单请求/响应式桥接
- `ui`：适合依赖当前 Antigravity 会话状态，或 `serve` 不稳定时

## 故障排查

- `fetch failed`：优先确认 Antigravity 已用 `9224` 启动，并且 CDP 可访问
- 一直弹目录授权：确认 `autoApproveAllowConversation=true`，并检查 `workspaceRoot` 是否过小
- 输出混入 UI 文本：当前默认 `passthroughOutput=true`，如需更干净结果，可调整配置
- 找不到目标页：尝试显式设置 `OPENCLI_CDP_TARGET`

## 文档入口

- 操作手册：[MANUAL.zh.md](docs/MANUAL.zh.md)
- 英文 README：[README.md](README.md)
- 英文手册：[MANUAL.md](docs/MANUAL.md)
- Skill 入口定义：[SKILL.md](SKILL.md)
