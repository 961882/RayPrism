# ray-util-antigravity-bridging 操作手册

[English](MANUAL.md) | 中文

这份手册从使用者视角说明，如何一步一步使用 `ray-util-antigravity-bridging`。

## 使用方式总览

你可以用两种方式使用它：

- 在对话里触发这个 skill，让代理替你走桥
- 在终端里直接执行 `scripts/bridge-*.sh`

下面的步骤主要以终端方式说明，因为它更容易排查和验证。

## Step 0：安装前置依赖

本 skill 依赖 [opencli](https://github.com/jackwener/opencli) 通过 Chrome DevTools Protocol (CDP) 与 Antigravity 桌面应用通信。

**安装 `opencli`：**

```bash
npm install -g @jackwener/opencli
```

**安装 skill 的 Node.js 依赖：**

```bash
cd <SKILL_DIR>/scripts/bridge && npm install
```

检查点：

- `opencli --help` 能正常输出帮助信息
- `scripts/bridge/` 下存在 `node_modules/` 目录

## Step 1：进入 skill 根目录

前提：本 skill 已经安装完成。请将 `<SKILL_DIR>` 替换为实际的 skill 根目录。

```bash
cd <SKILL_DIR>
```

## Step 2：启动 Antigravity 调试端口

如果 Antigravity 还没有启动，先打开它的 CDP 调试端口：

```bash
/Applications/Antigravity.app/Contents/MacOS/Electron --remote-debugging-port=9224
```

检查点：

- Antigravity 窗口已经打开
- `OPENCLI_CDP_ENDPOINT` 默认可指向 `http://127.0.0.1:9224`

## Step 3：确认桥配置

先确认 bridge 看到的实际配置：

```bash
bash scripts/bridge-config.sh
```

重点看这些字段：

- `workspaceRoot`
- `defaultTransport`
- `servePort`
- `autoApproveRunCommands`
- `autoApproveAllowConversation`

## Step 4：发起一次最小请求

先做最小 smoke test：

```bash
bash scripts/bridge-run.sh --prompt "请只回复：桥已连通"
```

你会看到类似输出：

- `Run created: ag-...`
- `Trying serve transport` 或 `Trying ui transport`
- `completed via serve` 或 `completed via ui`

如果这一步成功，说明桥已经能工作。

## Step 5：检查运行结果

如果你拿到了 `run-id`，可以随时检查状态：

```bash
bash scripts/bridge-check.sh --run <run-id>
```

也可以直接看落盘文件：

```bash
cat runs/<run-id>/state/state.json
cat runs/<run-id>/output/output.txt
cat runs/<run-id>/step02-execute/error.log
```

怎么看：

- `state/state.json`：当前状态、使用的 transport、时间戳
- `output/output.txt`：桥返回的最终文本
- `step02-execute/error.log`：失败日志

## Step 6：在长任务中途停止

如果一次桥接卡住或不再需要，可以终止：

```bash
bash scripts/bridge-kill.sh --run <run-id>
```

结束后再次检查：

```bash
bash scripts/bridge-check.sh --run <run-id>
```

## Step 7：按项目切换 `workspaceRoot`

如果你要桥接另一个项目目录，不一定要改默认配置；更推荐按次覆盖：

```bash
AG_BRIDGE_WORKSPACE_ROOT=/Users/ray/Projects/another-project \
bash scripts/bridge-run.sh --prompt "请检查 ./README.md"
```

适合场景：

- 你有多个项目
- 不希望长期修改 `config/default.json`
- 想减少目录授权弹窗

## Step 8：强制指定 transport

默认推荐 `auto`。如果你想手动控制：

```bash
bash scripts/bridge-run.sh --transport serve --prompt "请只回复 SERVE-OK"
```

```bash
bash scripts/bridge-run.sh --transport ui --prompt "请只回复 UI-OK"
```

建议：

- 简单问答先试 `serve`
- 依赖当前会话状态时用 `ui`
- 不确定时用 `auto`

## Step 9：在对话里怎么用

如果你是通过代理对话来用这个 skill，可以直接说：

- `通过 bridge 调用 Antigravity：请检查 ./docs/spec.md`
- `检查 bridge run ag-20260324092015-60510e63`
- `停止 bridge run ag-20260324092015-60510e63`

如果仓库根规则已经接到这个 skill，代理会优先走这里的生产入口。

## 常见问题

### 1. 一直看到 `fetch failed`

先检查：

- Antigravity 是否真的以 `9224` 启动
- `opencli` 是否可用
- `OPENCLI_CDP_TARGET` 是否指向正确页面

### 2. 一直弹目录授权

先检查：

- `workspaceRoot` 是否设置得太小
- `autoApproveAllowConversation` 是否为 `true`
- 是否在访问工作区外的全新目录

### 3. 输出里混入 UI 文本

这是因为当前默认 `passthroughOutput=true`。如果你更想要清洗后的结果，可以在配置里关闭它。

## 推荐日常工作流

1. 启动 Antigravity
2. 执行 `bash scripts/bridge-config.sh`
3. 执行 `bash scripts/bridge-run.sh --prompt "..."`
4. 需要时执行 `bash scripts/bridge-check.sh --run <run-id>`
5. 出现问题时看 `state/state.json` 和 `step02-execute/error.log`

## 相关文档

- README：[README.zh.md](../README.zh.md)
- 英文 README：[README.md](../README.md)
- 英文手册：[MANUAL.md](MANUAL.md)
