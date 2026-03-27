import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { BridgeConfig, TransportMode } from './config.ts';

export type RunStatus = 'starting' | 'running' | 'done' | 'error' | 'killed';

export interface RunState {
  runId: string;
  runDir: string;
  stateDir: string;
  outputDir: string;
  stepDir: string;
  runConfigFile: string;
  stateFile: string;
  promptFile: string;
  outputFile: string;
  errorFile: string;
  status: RunStatus;
  prompt: string;
  model: string;
  transport: TransportMode;
  timeoutMs: number;
  startTime: string;
  heartbeat?: string;
  endTime?: string;
  pid?: number;
  resultSummary?: string;
  error?: string;
  transportUsed?: 'serve' | 'ui';
}

export interface CreateRunInput {
  prompt: string;
  model: string;
  transport: TransportMode;
  timeoutMs: number;
}

export function createRunId(): string {
  const iso = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `ag-${iso}-${randomUUID().slice(0, 8)}`;
}

export async function ensureRunsDir(config: BridgeConfig): Promise<void> {
  await fs.mkdir(config.runsDir, { recursive: true });
}

export async function createRun(config: BridgeConfig, input: CreateRunInput): Promise<RunState> {
  await ensureRunsDir(config);
  const runId = createRunId();
  const runDir = path.join(config.runsDir, runId);
  const stateDir = path.join(runDir, 'state');
  const outputDir = path.join(runDir, 'output');
  const stepDir = path.join(runDir, 'step02-execute');
  await fs.mkdir(stateDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(stepDir, { recursive: true });

  const runConfigFile = path.join(runDir, 'config.json');
  const promptFile = path.join(stepDir, 'prompt.txt');
  const outputFile = path.join(outputDir, 'output.txt');
  const errorFile = path.join(stepDir, 'error.log');
  const stateFile = path.join(stateDir, 'state.json');

  await fs.writeFile(promptFile, input.prompt, 'utf8');
  await fs.writeFile(outputFile, '', 'utf8');
  await fs.writeFile(errorFile, '', 'utf8');
  await fs.writeFile(
    runConfigFile,
    `${JSON.stringify(
      {
        prompt: input.prompt,
        model: input.model,
        transport: input.transport,
        timeoutMs: input.timeoutMs
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  const state: RunState = {
    runId,
    runDir,
    stateDir,
    outputDir,
    stepDir,
    runConfigFile,
    stateFile,
    promptFile,
    outputFile,
    errorFile,
    status: 'starting',
    prompt: input.prompt,
    model: input.model,
    transport: input.transport,
    timeoutMs: input.timeoutMs,
    startTime: new Date().toISOString()
  };

  await writeState(state);
  return state;
}

export async function writeState(state: RunState): Promise<void> {
  const tmpFile = `${state.stateFile}.tmp`;
  const content = `${JSON.stringify(state, null, 2)}\n`;
  await fs.writeFile(tmpFile, content, 'utf8');
  await fs.rename(tmpFile, state.stateFile);
}

export async function readState(stateFile: string): Promise<RunState> {
  const raw = await fs.readFile(stateFile, 'utf8');
  return JSON.parse(raw) as RunState;
}

export async function updateState(
  stateFile: string,
  patch: Partial<RunState> | ((current: RunState) => RunState)
): Promise<RunState> {
  const current = await readState(stateFile);
  const next = typeof patch === 'function' ? patch(current) : { ...current, ...patch };
  await writeState(next);
  return next;
}

export async function appendOutput(stateFile: string, text: string): Promise<void> {
  const state = await readState(stateFile);
  await fs.appendFile(state.outputFile, text, 'utf8');
}

export async function appendError(stateFile: string, text: string): Promise<void> {
  const state = await readState(stateFile);
  await fs.appendFile(state.errorFile, text, 'utf8');
}

export async function resolveStateFile(config: BridgeConfig, target: string): Promise<string> {
  const absoluteTarget = path.isAbsolute(target) ? target : path.resolve(process.cwd(), target);
  const direct =
    absoluteTarget.endsWith('.json')
      ? absoluteTarget
      : absoluteTarget.includes(`${path.sep}runs${path.sep}`)
        ? path.join(absoluteTarget, 'state', 'state.json')
        : path.join(config.runsDir, target, 'state', 'state.json');
  await fs.access(direct);
  return direct;
}

export async function checkState(stateFile: string): Promise<RunState> {
  const state = await readState(stateFile);
  if (state.status !== 'running' || !state.pid) {
    return state;
  }

  try {
    process.kill(state.pid, 0);
    return state;
  } catch {
    const next = { ...state, status: 'killed' as const, error: `Process ${state.pid} is not alive` };
    await writeState(next);
    return next;
  }
}
