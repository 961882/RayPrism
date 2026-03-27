# ray-util-antigravity-bridging

English | [中文](README.zh.md)

Production Antigravity bridge skill for traceable, inspectable, and stoppable local bridge runs.

## Highlights

- Connects to Antigravity through `opencli`, with automatic fallback between `serve` and `ui`.
- Persists every run so you can inspect `state`, `prompt`, `output`, and `error`.
- Supports `workspaceRoot` and rewrites in-workspace paths to relative paths to reduce directory permission prompts.
- Can auto-approve common UI interactions such as `Run`, `Accept`, and `Allow This Conversation`.
- Ships stable shell entrypoints that work well as the repository-wide bridge surface.

## Requirements

- Antigravity desktop app installed and launchable
- `opencli` installed and available in `PATH`
- Node.js ≥ 18 and `tsx` (installed via `cd scripts/bridge && npm install`)
- Default CDP endpoint available at `http://127.0.0.1:9224`

## Quick Start

Assumption: the skill is already installed. Replace `<SKILL_DIR>` with the installed skill root.

```bash
cd <SKILL_DIR>
```

### 0. Install prerequisites

**Install `opencli`** — this skill depends on [opencli](https://github.com/jackwener/opencli) to communicate with the Antigravity desktop app via CDP.

```bash
npm install -g @jackwener/opencli
```

**Install skill Node.js dependencies:**

```bash
cd scripts/bridge && npm install && cd -
```

> Verify: run `opencli --help` to confirm `opencli` is on your `PATH`.

1. Start Antigravity with remote debugging enabled.

```bash
/Applications/Antigravity.app/Contents/MacOS/Electron --remote-debugging-port=9224
```

2. Inspect the effective bridge configuration.

```bash
bash scripts/bridge-config.sh
```

3. Send a minimal bridge request.

```bash
bash scripts/bridge-run.sh --prompt "Please reply with: bridge connected"
```

4. Use the returned `run-id` to inspect status when needed.

```bash
bash scripts/bridge-check.sh --run <run-id>
```

## Main Commands

| Goal | Command |
|---|---|
| Show config | `bash scripts/bridge-config.sh` |
| Run the bridge | `bash scripts/bridge-run.sh --prompt "<prompt>"` |
| Check a run | `bash scripts/bridge-check.sh --run <run-id>` |
| Kill a run | `bash scripts/bridge-kill.sh --run <run-id>` |

## Layout

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
└── runs/              (auto-generated, gitignored)
```

## Key Configuration

The default configuration lives in `config/default.json`.

| Key | Purpose |
|---|---|
| `forceBridge` | Force all requests through the bridge |
| `strict` | Do not fall back to local answering when the bridge fails |
| `transport` | Default transport, usually `auto` |
| `servePort` | Port for `serve`, default `8082` |
| `autoApproveRunCommands` | Auto-click `Run` / `Accept` |
| `autoApproveAllowConversation` | Auto-click `Allow This Conversation` |

Common environment overrides:

| Environment variable | Purpose |
|---|---|
| `AG_BRIDGE_WORKSPACE_ROOT` | Override the active workspace root |
| `AG_BRIDGE_TRANSPORT` | Force `auto` / `serve` / `ui` |
| `AG_BRIDGE_TIMEOUT_MS` | Override the timeout |
| `OPENCLI_CDP_ENDPOINT` | Override the CDP endpoint |
| `OPENCLI_CDP_TARGET` | Override the CDP target page |

## Run Artifacts

Each run is written to `runs/<run-id>/`:

```text
runs/<run-id>/
├── config.json
├── state/state.json
├── output/output.txt
└── step02-execute/
    ├── prompt.txt
    └── error.log
```

## Transport Modes

- `auto`: recommended default; tries `serve` first and falls back to `ui`
- `serve`: best for simple request/response bridge calls
- `ui`: best when the active Antigravity session matters, or when `serve` is unreliable

## Troubleshooting

- `fetch failed`: verify that Antigravity is running on `9224` and that the CDP endpoint is reachable
- repeated directory permission prompts: check `autoApproveAllowConversation=true` and make sure `workspaceRoot` is not too narrow
- output includes UI chrome: the default keeps `passthroughOutput=true`; adjust it if you want cleaner output
- target page not found: try setting `OPENCLI_CDP_TARGET` explicitly

## Documentation

- User manual: [MANUAL.md](docs/MANUAL.md)
- Chinese README: [README.zh.md](README.zh.md)
- Chinese manual: [MANUAL.zh.md](docs/MANUAL.zh.md)
- Skill entry definition: [SKILL.md](SKILL.md)
