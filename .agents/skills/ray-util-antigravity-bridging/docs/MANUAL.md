# ray-util-antigravity-bridging Manual

English | [中文](MANUAL.zh.md)

This manual explains how to use `ray-util-antigravity-bridging` step by step from a user perspective.

## Usage Overview

You can use the skill in two ways:

- Trigger it from chat and let the agent route through the bridge for you
- Run the `scripts/bridge-*.sh` commands directly from the terminal

The steps below focus on terminal usage because it is easier to verify and troubleshoot.

## Step 0: Install prerequisites

This skill depends on [opencli](https://github.com/jackwener/opencli) to communicate with the Antigravity desktop app via Chrome DevTools Protocol (CDP).

**Install `opencli`:**

```bash
npm install -g @jackwener/opencli
```

**Install the skill's Node.js dependencies:**

```bash
cd <SKILL_DIR>/scripts/bridge && npm install
```

Checkpoint:

- `opencli --help` prints the usage information
- `node_modules/` exists inside `scripts/bridge/`

## Step 1: Enter the skill root

Assumption: the skill is already installed. Replace `<SKILL_DIR>` with the installed skill root.

```bash
cd <SKILL_DIR>
```

## Step 2: Start Antigravity with remote debugging

If Antigravity is not already running, start it with CDP enabled:

```bash
/Applications/Antigravity.app/Contents/MacOS/Electron --remote-debugging-port=9224
```

Checkpoint:

- The Antigravity window is open
- `OPENCLI_CDP_ENDPOINT` can use the default `http://127.0.0.1:9224`

## Step 3: Inspect the bridge configuration

Check the effective bridge configuration first:

```bash
bash scripts/bridge-config.sh
```

Pay attention to:

- `workspaceRoot`
- `defaultTransport`
- `servePort`
- `autoApproveRunCommands`
- `autoApproveAllowConversation`

## Step 4: Run a minimal request

Start with a small smoke test:

```bash
bash scripts/bridge-run.sh --prompt "Please reply with: bridge connected"
```

You should see output such as:

- `Run created: ag-...`
- `Trying serve transport` or `Trying ui transport`
- `completed via serve` or `completed via ui`

If this works, the bridge is operational.

## Step 5: Inspect the run

Once you have a `run-id`, check it anytime:

```bash
bash scripts/bridge-check.sh --run <run-id>
```

You can also read the artifacts directly:

```bash
cat runs/<run-id>/state/state.json
cat runs/<run-id>/output/output.txt
cat runs/<run-id>/step02-execute/error.log
```

How to read them:

- `state/state.json`: status, transport used, and timestamps
- `output/output.txt`: final bridge output
- `step02-execute/error.log`: failure details

## Step 6: Stop a long-running task

If a bridge run is stuck or no longer needed, terminate it:

```bash
bash scripts/bridge-kill.sh --run <run-id>
```

Then verify again:

```bash
bash scripts/bridge-check.sh --run <run-id>
```

## Step 7: Switch `workspaceRoot` per project

When you need to bridge a different project, prefer an environment override instead of editing the default config:

```bash
AG_BRIDGE_WORKSPACE_ROOT=/Users/ray/Projects/another-project \
bash scripts/bridge-run.sh --prompt "Please inspect ./README.md"
```

This is useful when:

- You work across multiple projects
- You do not want to permanently change `config/default.json`
- You want to reduce directory permission prompts

## Step 8: Force a specific transport

`auto` is the default and recommended mode. If you want manual control:

```bash
bash scripts/bridge-run.sh --transport serve --prompt "Please reply with SERVE-OK"
```

```bash
bash scripts/bridge-run.sh --transport ui --prompt "Please reply with UI-OK"
```

Recommendations:

- Use `serve` for simple request/response flows
- Use `ui` when the active Antigravity session matters
- Use `auto` if you want the safest default

## Step 9: Use it from chat

If you are using this through an agent conversation, you can say things like:

- `Use the bridge to ask Antigravity to inspect ./docs/spec.md`
- `Check bridge run ag-20260324092015-60510e63`
- `Stop bridge run ag-20260324092015-60510e63`

If the repository-level routing already points here, the agent should prefer this production bridge entrypoint.

## Common Issues

### 1. You keep seeing `fetch failed`

Check:

- whether Antigravity is really running on `9224`
- whether `opencli` is available
- whether `OPENCLI_CDP_TARGET` points to the correct page

### 2. You keep seeing directory permission prompts

Check:

- whether `workspaceRoot` is too narrow
- whether `autoApproveAllowConversation` is set to `true`
- whether you are accessing a brand-new directory outside the current workspace

### 3. The output contains UI chrome

That usually means `passthroughOutput=true`. If you want cleaner output, turn it off in the configuration.

## Recommended Daily Flow

1. Start Antigravity
2. Run `bash scripts/bridge-config.sh`
3. Run `bash scripts/bridge-run.sh --prompt "..."`
4. Use `bash scripts/bridge-check.sh --run <run-id>` when needed
5. Inspect `state/state.json` and `step02-execute/error.log` whenever something goes wrong

## Related Docs

- README: [README.md](../README.md)
- Chinese README: [README.zh.md](../README.zh.md)
- Chinese manual: [MANUAL.zh.md](MANUAL.zh.md)
