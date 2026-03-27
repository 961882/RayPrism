import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getConfig } from './config.ts';
import type { TransportMode } from './config.ts';
import { executeRun } from './executor.ts';
import { emitDone, emitError, emitStatus } from './protocol.ts';
import {
  checkState,
  createRun,
  readState,
  resolveStateFile,
  updateState,
  writeState
} from './state.ts';

interface RunOptions {
  prompt: string;
  model: string;
  transport: TransportMode;
  asyncMode: boolean;
  timeoutMs: number;
}

function parseArgs(argv: string[]): { command: string; values: Map<string, string | boolean> } {
  const [command = 'run', ...rest] = argv;
  const values = new Map<string, string | boolean>();

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith('--')) {
      values.set(key, true);
      continue;
    }
    values.set(key, next);
    index += 1;
  }

  return { command, values };
}

function getString(values: Map<string, string | boolean>, key: string, fallback = ''): string {
  const raw = values.get(key);
  return typeof raw === 'string' ? raw : fallback;
}

function getBoolean(values: Map<string, string | boolean>, key: string): boolean {
  return values.get(key) === true;
}

function getNumber(values: Map<string, string | boolean>, key: string, fallback: number): number {
  const raw = getString(values, key);
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getTransport(values: Map<string, string | boolean>, fallback: TransportMode): TransportMode {
  const raw = getString(values, 'transport', fallback);
  if (raw === 'auto' || raw === 'serve' || raw === 'ui') return raw;
  return fallback;
}

async function runWorker(stateFile: string): Promise<void> {
  const config = getConfig();
  let state = await updateState(stateFile, (current) => ({
    ...current,
    status: 'running',
    pid: process.pid,
    heartbeat: new Date().toISOString()
  }));

  try {
    const result = await executeRun(stateFile, config);
    state = await updateState(stateFile, (current) => ({
      ...current,
      status: 'done',
      heartbeat: new Date().toISOString(),
      endTime: new Date().toISOString(),
      resultSummary: result.output.slice(0, 500),
      transportUsed: result.transportUsed
    }));
    emitDone(`${state.runId} completed via ${result.transportUsed}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    state = await updateState(stateFile, (current) => ({
      ...current,
      status: 'error',
      heartbeat: new Date().toISOString(),
      endTime: new Date().toISOString(),
      error: message
    }));
    await fs.appendFile(state.errorFile, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
    emitError(message);
    process.exitCode = 1;
  }
}

async function startRun(options: RunOptions): Promise<void> {
  const config = getConfig();
  const state = await createRun(config, {
    prompt: options.prompt,
    model: options.model,
    transport: options.transport,
    timeoutMs: options.timeoutMs
  });

  emitStatus(`Run created: ${state.runId}`);
  emitStatus(`Run directory: ${state.runDir}`);

  if (!options.asyncMode) {
    await runWorker(state.stateFile);
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const child = spawn(process.execPath, [__filename, 'worker', '--state-file', state.stateFile], {
    detached: true,
    stdio: 'ignore',
    env: process.env
  });
  child.unref();
  await updateState(state.stateFile, (current) => ({
    ...current,
    pid: child.pid
  }));
  emitDone(`Run started asynchronously: ${state.runId}`);
}

async function checkRun(target: string): Promise<void> {
  const config = getConfig();
  const stateFile = await resolveStateFile(config, target);
  const state = await checkState(stateFile);
  console.log(JSON.stringify(state, null, 2));
}

async function killRun(target: string): Promise<void> {
  const config = getConfig();
  const stateFile = await resolveStateFile(config, target);
  const state = await readState(stateFile);
  if (!state.pid) {
    throw new Error('Run has no pid');
  }

  try {
    process.kill(state.pid, 'SIGTERM');
  } catch (error) {
    throw new Error(`Failed to kill ${state.pid}: ${error instanceof Error ? error.message : String(error)}`);
  }

  await writeState({
    ...state,
    status: 'killed',
    endTime: new Date().toISOString(),
    error: `Process ${state.pid} was terminated by user`
  });
  emitDone(`Killed run ${state.runId}`);
}

async function main(): Promise<void> {
  const { command, values } = parseArgs(process.argv.slice(2));
  const config = getConfig();

  if (command === 'config') {
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  if (command === 'worker') {
    const stateFile = getString(values, 'state-file');
    if (!stateFile) throw new Error('Missing --state-file');
    await runWorker(stateFile);
    return;
  }

  if (command === 'check') {
    const target = getString(values, 'run') || getString(values, 'state-file');
    if (!target) throw new Error('Missing --run');
    await checkRun(target);
    return;
  }

  if (command === 'kill') {
    const target = getString(values, 'run') || getString(values, 'state-file');
    if (!target) throw new Error('Missing --run');
    await killRun(target);
    return;
  }

  if (command !== 'run') {
    throw new Error(`Unknown command: ${command}`);
  }

  const prompt = getString(values, 'prompt');
  if (!prompt) throw new Error('Missing --prompt');

  await startRun({
    prompt,
    model: getString(values, 'model', config.defaultModel),
    transport: getTransport(values, config.defaultTransport),
    asyncMode: getBoolean(values, 'async'),
    timeoutMs: getNumber(values, 'timeout-ms', config.runTimeoutMs)
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  emitError(message);
  process.exit(1);
});
