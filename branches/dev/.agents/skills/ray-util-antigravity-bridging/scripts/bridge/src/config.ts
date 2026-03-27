import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type TransportMode = 'auto' | 'serve' | 'ui';

interface BridgeFileConfig {
  forceBridge?: boolean;
  strict?: boolean;
  transport?: TransportMode;
  workspaceRoot?: string;
  cdpEndpoint?: string;
  cdpTarget?: string;
  pathOnlyReferences?: boolean;
  passthroughOutput?: boolean;
  model?: string;
  serveModel?: string;
  servePort?: number;
  timeoutMs?: number;
  pollIntervalMs?: number;
  stablePolls?: number;
  serveStartupTimeoutMs?: number;
  autoApproveRunCommands?: boolean;
  autoApproveAllowConversation?: boolean;
}

export interface BridgeConfig {
  bridgeRoot: string;
  configFile: string;
  runsDir: string;
  opencliBin: string;
  forceBridge: boolean;
  strict: boolean;
  workspaceRoot: string;
  cdpEndpoint: string;
  cdpTarget: string;
  pathOnlyReferences: boolean;
  passthroughOutput: boolean;
  uiModel: string;
  serveModel: string;
  servePort: number;
  serveBaseUrl: string;
  defaultModel: string;
  defaultTransport: TransportMode;
  runTimeoutMs: number;
  pollIntervalMs: number;
  stablePolls: number;
  serveStartupTimeoutMs: number;
  autoApproveRunCommands: boolean;
  autoApproveAllowConversation: boolean;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillRoot = path.resolve(__dirname, '../../../../');
const bridgeRoot = skillRoot;
const configFile = path.join(skillRoot, 'config', 'default.json');
const defaultWorkspaceRoot = path.resolve(skillRoot, '../../..');

function readFileConfig(): BridgeFileConfig {
  try {
    const raw = fs.readFileSync(configFile, 'utf8');
    return JSON.parse(raw) as BridgeFileConfig;
  } catch {
    return {};
  }
}

function hasEnv(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(process.env, name);
}

function envNumber(name: string, fallback: number): number {
  if (!hasEnv(name)) return fallback;
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function envBoolean(name: string, fallback: boolean): boolean {
  if (!hasEnv(name)) return fallback;
  const raw = process.env[name];
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function envTransport(name: string, fallback: TransportMode): TransportMode {
  if (!hasEnv(name)) return fallback;
  const raw = process.env[name];
  if (raw === 'auto' || raw === 'serve' || raw === 'ui') return raw;
  return fallback;
}

function envString(name: string, fallback: string): string {
  if (!hasEnv(name)) return fallback;
  return process.env[name] ?? fallback;
}

export function getConfig(): BridgeConfig {
  const fileConfig = readFileConfig();
  const servePort = envNumber('AG_BRIDGE_SERVE_PORT', fileConfig.servePort ?? 8082);
  const workspaceRoot = envString(
    'AG_BRIDGE_WORKSPACE_ROOT',
    fileConfig.workspaceRoot || defaultWorkspaceRoot
  );
  const cdpEndpoint = envString('OPENCLI_CDP_ENDPOINT', fileConfig.cdpEndpoint || 'http://127.0.0.1:9224');
  const cdpTarget = envString('OPENCLI_CDP_TARGET', fileConfig.cdpTarget || 'test01');
  const uiModel = envString('AG_BRIDGE_DEFAULT_MODEL', fileConfig.model ?? '');
  const serveModel = envString('AG_BRIDGE_SERVE_MODEL', fileConfig.serveModel || 'claude');
  const defaultTransport = envTransport('AG_BRIDGE_TRANSPORT', fileConfig.transport || 'auto');

  return {
    bridgeRoot,
    configFile,
    runsDir: path.join(bridgeRoot, 'runs'),
    opencliBin: envString('AG_BRIDGE_OPENCLI_BIN', 'opencli'),
    forceBridge: envBoolean('AG_BRIDGE_FORCE', fileConfig.forceBridge ?? false),
    strict: envBoolean('AG_BRIDGE_STRICT', fileConfig.strict ?? false),
    workspaceRoot,
    cdpEndpoint,
    cdpTarget,
    pathOnlyReferences: envBoolean(
      'AG_BRIDGE_PATH_ONLY_REFERENCES',
      fileConfig.pathOnlyReferences ?? true
    ),
    passthroughOutput: envBoolean(
      'AG_BRIDGE_PASSTHROUGH_OUTPUT',
      fileConfig.passthroughOutput ?? true
    ),
    uiModel,
    serveModel,
    servePort,
    serveBaseUrl: envString('AG_BRIDGE_SERVE_BASE_URL', `http://127.0.0.1:${servePort}`),
    defaultModel: uiModel,
    defaultTransport,
    runTimeoutMs: envNumber('AG_BRIDGE_TIMEOUT_MS', fileConfig.timeoutMs ?? 180000),
    pollIntervalMs: envNumber('AG_BRIDGE_POLL_MS', fileConfig.pollIntervalMs ?? 2000),
    stablePolls: envNumber('AG_BRIDGE_STABLE_POLLS', fileConfig.stablePolls ?? 2),
    serveStartupTimeoutMs: envNumber(
      'AG_BRIDGE_SERVE_STARTUP_TIMEOUT_MS',
      fileConfig.serveStartupTimeoutMs ?? 12000
    ),
    autoApproveRunCommands: envBoolean(
      'AG_BRIDGE_AUTO_APPROVE_RUN',
      fileConfig.autoApproveRunCommands ?? true
    ),
    autoApproveAllowConversation: envBoolean(
      'AG_BRIDGE_AUTO_APPROVE_ALLOW_CONVERSATION',
      fileConfig.autoApproveAllowConversation ?? false
    )
  };
}
