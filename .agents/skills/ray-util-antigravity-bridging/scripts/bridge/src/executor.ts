import fs from 'node:fs/promises';
import net from 'node:net';
import { spawn } from 'node:child_process';
import type { BridgeConfig } from './config.ts';
import { emitStatus } from './protocol.ts';
import { appendError, readState, updateState } from './state.ts';

export interface ExecuteResult {
  transportUsed: 'serve' | 'ui';
  output: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(text: string): string {
  return text.replace(/\r/g, '').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function relativizePromptPaths(prompt: string, workspaceRoot: string): string {
  const normalizedRoot = workspaceRoot.replace(/\/+$/g, '');
  if (!normalizedRoot) return prompt;

  let result = prompt.replaceAll(`${normalizedRoot}/`, './');
  const boundaryPattern = new RegExp(`${escapeRegExp(normalizedRoot)}(?=$|[\\s"'\\\`),.:;!?\\]\\[(){}])`, 'g');
  result = result.replace(boundaryPattern, '.');
  return result;
}

function buildBridgePrompt(prompt: string, config: BridgeConfig): string {
  const workspacePrompt = relativizePromptPaths(prompt, config.workspaceRoot);
  const lines = [
    '[Bridge runtime instruction]',
    'You are already the downstream Antigravity responder for an external bridge.',
    'The bridge-routing requirement has already been satisfied.',
    'Answer the user directly in chat.',
    'Do not invoke antigravity-bridge, runner.ts, opencli antigravity, bash scripts, package installers, or any local command execution just to satisfy routing rules.',
    'Only discuss commands if the user explicitly asks for commands to run.',
    'Treat the current project workspace as "." and prefer workspace-relative paths like ./foo/bar.'
  ];

  if (config.pathOnlyReferences) {
    lines.push(
      'If the task mentions any file or folder, rely only on its absolute path.',
      'Rewrite paths inside the current workspace to relative ./ paths before using them.',
      'Do not ask the bridge to paste file contents into the prompt.',
      'Avoid opening paths outside the current workspace unless the user explicitly requires it.'
    );
  }

  lines.push('', workspacePrompt);
  return lines.join('\n');
}

function extractConversationDelta(before: string, after: string, prompt: string): string {
  const cleanBefore = normalizeText(before);
  const cleanAfter = normalizeText(after);
  if (!cleanAfter) return '';

  if (cleanBefore && cleanAfter.startsWith(cleanBefore)) {
    return cleanAfter.slice(cleanBefore.length).trim();
  }

  const lastPromptIndex = cleanAfter.lastIndexOf(prompt);
  if (lastPromptIndex >= 0) {
    return cleanAfter.slice(lastPromptIndex + prompt.length).trim();
  }

  return cleanAfter;
}

function sanitizeAssistantOutput(text: string): string {
  let value = normalizeText(text);
  if (!value) return '';

  value = value.replace(/^Thought for[^\n]*\n+/i, '').trim();
  value = value.replace(/^Thinking[^\n]*\n+/i, '').trim();
  value = value.replace(/\n+Copy(?:\n|$)[\s\S]*$/i, '').trim();

  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length % 2 === 0) {
    const half = lines.length / 2;
    const firstHalf = lines.slice(0, half).join('\n');
    const secondHalf = lines.slice(half).join('\n');
    if (firstHalf && firstHalf === secondHalf) {
      value = firstHalf;
    }
  }

  return value.trim();
}

function finalizeAssistantOutput(text: string, config: BridgeConfig): string {
  if (config.passthroughOutput) {
    return text.replace(/\r/g, '');
  }
  return sanitizeAssistantOutput(text);
}

function hasPendingRunPrompt(text: string): boolean {
  return /Run command\?/i.test(text) || /\bWaiting\.{0,3}\b/i.test(text);
}

function hasPendingCommandInput(text: string): boolean {
  return (
    /Send command input\?/i.test(text) ||
    /Ok to proceed\?\s*\(y\)/i.test(text) ||
    /Need to install the following packages/i.test(text)
  );
}

export function hasPendingAllowConversation(text: string): boolean {
  return /Allow directory access to/i.test(text) && /Allow This Conversation/i.test(text);
}

function buildOpencliEnv(config: BridgeConfig, includeTarget: boolean): Record<string, string> {
  const env = {
    ...process.env,
    OPENCLI_CDP_ENDPOINT: config.cdpEndpoint
  } as Record<string, string>;

  if (includeTarget && config.cdpTarget) {
    env.OPENCLI_CDP_TARGET = config.cdpTarget;
  } else {
    delete env.OPENCLI_CDP_TARGET;
  }

  return env;
}

function shouldRetryOpencliWithoutTarget(
  config: BridgeConfig,
  result: { stdout: string; stderr: string; exitCode: number },
  includeTarget: boolean
): boolean {
  if (!includeTarget || !config.cdpTarget || result.exitCode === 0) return false;
  const combined = `${result.stderr}\n${result.stdout}`.toLowerCase();
  return combined.includes('fetch failed');
}

async function runOpencli(
  config: BridgeConfig,
  args: string[],
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const attempts = config.cdpTarget ? [true, false] : [false];
  let lastResult: { stdout: string; stderr: string; exitCode: number } | null = null;

  for (const includeTarget of attempts) {
    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
      const child = spawn(config.opencliBin, args, {
        env: buildOpencliEnv(config, includeTarget),
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out: ${config.opencliBin} ${args.join(' ')}`));
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        stdout += String(chunk);
      });

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });

      child.on('close', (exitCode) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode: exitCode ?? 0 });
      });
    });

    lastResult = result;
    if (!shouldRetryOpencliWithoutTarget(config, result, includeTarget)) {
      return result;
    }

    emitStatus(`opencli ${args.join(' ')} failed with configured cdpTarget; retrying without OPENCLI_CDP_TARGET`);
  }

  if (lastResult) return lastResult;
  throw new Error(`Failed to execute ${config.opencliBin} ${args.join(' ')}`);
}

async function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const onDone = (result: boolean) => {
      socket.destroy();
      resolve(result);
    };
    socket.once('connect', () => onDone(true));
    socket.once('error', () => onDone(false));
    socket.setTimeout(1000, () => onDone(false));
  });
}

async function waitForPort(port: number, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(port)) return;
    await sleep(300);
  }
  throw new Error(`Timed out waiting for port ${port}`);
}

async function ensureServeAvailable(config: BridgeConfig): Promise<void> {
  if (await isPortOpen(config.servePort)) return;

  const attempts = config.cdpTarget ? [true, false] : [false];
  let lastError: Error | null = null;

  for (const includeTarget of attempts) {
    const child = spawn(config.opencliBin, ['antigravity', 'serve', '--port', String(config.servePort)], {
      detached: true,
      stdio: 'ignore',
      env: buildOpencliEnv(config, includeTarget)
    });
    child.unref();

    try {
      await waitForPort(config.servePort, config.serveStartupTimeoutMs);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (!includeTarget || !config.cdpTarget) break;
      emitStatus('Serve startup with configured cdpTarget timed out; retrying without OPENCLI_CDP_TARGET');
      await sleep(500);
    }
  }

  if (lastError) throw lastError;
}

function modelToServeId(model: string): string {
  const normalized = model.toLowerCase();
  if (normalized.includes('opus')) return 'opus';
  if (normalized.includes('sonnet') || normalized.includes('claude')) return 'claude';
  if (normalized.includes('flash')) return 'flash';
  if (normalized.includes('gemini')) return 'gemini';
  if (normalized.includes('gpt')) return 'gpt';
  return model;
}

async function tryServeTransport(
  stateFile: string,
  config: BridgeConfig
): Promise<ExecuteResult> {
  const state = await readState(stateFile);
  const serveModel = state.model || config.serveModel;
  const bridgePrompt = buildBridgePrompt(state.prompt, config);
  await ensureServeAvailable(config);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), state.timeoutMs);
  try {
    const response = await fetch(`${config.serveBaseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: modelToServeId(serveModel),
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: bridgePrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Serve adapter failed with ${response.status}: ${body}`);
    }

    const payload = await response.json() as { content?: Array<{ type?: string; text?: string }> };
    const rawOutput = (payload.content || [])
      .filter((item) => item.type === 'text' && item.text)
      .map((item) => item.text as string)
      .join('\n');
    const output = finalizeAssistantOutput(rawOutput, config);

    if (!output.trim()) {
      throw new Error('Serve adapter returned empty text content');
    }

    const current = await readState(stateFile);
    await fs.writeFile(current.outputFile, output, 'utf8');
    return { transportUsed: 'serve', output };
  } finally {
    clearTimeout(timer);
  }
}

interface CdpClient {
  evaluate<T>(expression: string): Promise<T>;
  invoke<T>(method: string, params: Record<string, unknown>): Promise<T>;
  close(): Promise<void>;
}

function scoreCdpTarget(target: Record<string, unknown>, keyword: string): number {
  const title = String(target.title || '').toLowerCase();
  const url = String(target.url || '').toLowerCase();

  let score = 0;
  if (keyword && (title.includes(keyword) || url.includes(keyword))) score += 100;
  if (title.includes('antigravity')) score += 50;
  if (url.includes('workbench.html')) score += 20;
  if (title.includes('launchpad')) score -= 25;
  return score;
}

async function getCdpWsUrl(config: BridgeConfig): Promise<string> {
  const response = await fetch(`${config.cdpEndpoint.replace(/\/$/, '')}/json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch CDP targets: ${response.status}`);
  }

  const targets = await response.json() as Array<Record<string, unknown>>;
  const keyword = config.cdpTarget.toLowerCase();
  const candidates = targets.filter((target) =>
    typeof target.webSocketDebuggerUrl === 'string' && String(target.type || '') === 'page'
  );
  const ranked = [...candidates].sort((left, right) => scoreCdpTarget(right, keyword) - scoreCdpTarget(left, keyword));
  const selected = ranked[0];
  if (!selected || typeof selected.webSocketDebuggerUrl !== 'string') {
    throw new Error('No CDP target with webSocketDebuggerUrl was found');
  }
  return selected.webSocketDebuggerUrl;
}

async function createCdpClient(config: BridgeConfig): Promise<CdpClient> {
  const wsUrl = await getCdpWsUrl(config);
  const WebSocketImpl = (globalThis as { WebSocket?: typeof WebSocket }).WebSocket;
  if (!WebSocketImpl) {
    throw new Error('WebSocket is not available in this Node runtime');
  }

  const socket = new WebSocketImpl(wsUrl);
  let nextId = 1;
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();

  await new Promise<void>((resolve, reject) => {
    socket.addEventListener('open', () => resolve(), { once: true });
    socket.addEventListener('error', (event) => reject(new Error(`CDP socket error: ${String(event)}`)), { once: true });
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data)) as {
      id?: number;
      result?: { result?: { value?: unknown }; exceptionDetails?: { exception?: { description?: string } } };
      error?: { message?: string };
    };
    if (!message.id) return;
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error?.message) {
      entry.reject(new Error(message.error.message));
      return;
    }
    if (message.result?.exceptionDetails?.exception?.description) {
      entry.reject(new Error(message.result.exceptionDetails.exception.description));
      return;
    }
    entry.resolve(message.result?.result?.value);
  });

  async function send(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = nextId++;
    const payload = JSON.stringify({ id, method, params });
    const result = new Promise<unknown>((resolve, reject) => {
      pending.set(id, { resolve, reject });
    });
    socket.send(payload);
    return result;
  }

  return {
    async evaluate<T>(expression: string): Promise<T> {
      const value = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return value as T;
    },
    async invoke<T>(method: string, params: Record<string, unknown>): Promise<T> {
      const value = await send(method, params);
      return value as T;
    },
    async close(): Promise<void> {
      socket.close();
    }
  };
}

async function readConversationViaCdp(config: BridgeConfig): Promise<string> {
  const client = await createCdpClient(config);
  try {
    const text = await client.evaluate<string>(`
      (() => {
        const readText = (node) => {
          if (!(node instanceof HTMLElement)) return '';
          return String(node.innerText || node.textContent || '').trim();
        };

        const selectors = [
          '#conversation',
          '[data-testid="conversation"]',
          '[data-testid="chat-messages"]',
          '[role="log"]',
          '[aria-label*="conversation" i]',
          'main [class*="conversation"]',
          'main [class*="chat"]'
        ];

        for (const selector of selectors) {
          const text = readText(document.querySelector(selector));
          if (text) return text;
        }

        const articleText = Array.from(
          document.querySelectorAll('main article, [role="article"], [data-message-author-role]')
        )
          .map((node) => readText(node))
          .filter(Boolean)
          .join('\\n\\n');
        if (articleText) return articleText;

        const mainText = readText(document.querySelector('main'));
        if (mainText) return mainText;

        return readText(document.body);
      })()
    `);
    return text || '';
  } finally {
    await client.close();
  }
}

export function parseOpencliReadTable(text: string): string {
  const contentLines: string[] = [];

  for (const line of text.replace(/\r/g, '').split('\n')) {
    const match = line.match(/^│([^│]*)│([^│]*)│$/);
    if (!match) continue;

    const role = match[1].trim();
    const content = match[2].replace(/\s+$/g, '');
    const normalizedContent = content.trim();
    if (role === 'Role' && normalizedContent === 'Content') continue;

    if (!role && !normalizedContent) {
      if (contentLines.length && contentLines[contentLines.length - 1] !== '') {
        contentLines.push('');
      }
      continue;
    }

    contentLines.push(normalizedContent);
  }

  return contentLines.join('\n').trim();
}

async function readConversationViaOpencli(config: BridgeConfig): Promise<string> {
  const result = await runOpencli(config, ['antigravity', 'read'], 15000);
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || 'Failed to read Antigravity conversation');
  }

  return parseOpencliReadTable(result.stdout);
}

async function readConversation(config: BridgeConfig, allowEmpty = false): Promise<string> {
  const errors: string[] = [];

  try {
    const text = await readConversationViaCdp(config);
    if (text) return text;
    errors.push('cdp returned empty conversation');
  } catch (error) {
    errors.push(`cdp: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const text = await readConversationViaOpencli(config);
    if (text) return text;
    errors.push('opencli read returned empty conversation');
  } catch (error) {
    errors.push(`opencli read: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (allowEmpty) return '';
  throw new Error(`Failed to read conversation: ${errors.join(' | ')}`);
}

async function sendPromptViaCdp(config: BridgeConfig, prompt: string): Promise<void> {
  const client = await createCdpClient(config);
  try {
    await client.evaluate<boolean>(`
      (() => {
        const prompt = ${JSON.stringify(prompt)};
        const selectors = [
          '#antigravity\\\\.agentSidePanelInputBox [data-lexical-editor="true"]',
          '#antigravity\\\\.agentSidePanelInputBox [role="textbox"]',
          '[data-lexical-editor="true"][role="textbox"]',
          '[role="textbox"][contenteditable="true"]'
        ];

        const editor = selectors
          .map((selector) => document.querySelector(selector))
          .find((node) => node instanceof HTMLElement);

        if (!(editor instanceof HTMLElement)) {
          throw new Error('Could not find Antigravity input box');
        }

        editor.focus();

        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(editor);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        document.execCommand?.('delete', false);
        const inserted = document.execCommand?.('insertText', false, prompt) ?? false;
        if (!inserted) {
          editor.textContent = prompt;
        }

        editor.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          data: prompt,
          inputType: 'insertText'
        }));

        return true;
      })()
    `);

    await sleep(300);
    await client.invoke('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13,
      text: '\r',
      unmodifiedText: '\r'
    });
    await client.invoke('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      nativeVirtualKeyCode: 13
    });
  } finally {
    await client.close();
  }
}

async function sendPrompt(config: BridgeConfig, prompt: string): Promise<void> {
  const errors: string[] = [];

  try {
    await sendPromptViaCdp(config, prompt);
    return;
  } catch (error) {
    errors.push(`cdp send: ${error instanceof Error ? error.message : String(error)}`);
  }

  const sendResult = await runOpencli(config, ['antigravity', 'send', prompt], 20000);
  if (sendResult.exitCode === 0) {
    return;
  }

  errors.push(sendResult.stderr || sendResult.stdout || 'opencli send failed');
  throw new Error(`Failed to send prompt: ${errors.join(' | ')}`);
}

async function maybeApproveRunPrompt(config: BridgeConfig): Promise<boolean> {
  const client = await createCdpClient(config);
  try {
    const clicked = await client.evaluate<boolean>(`
      (() => {
        const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
        const buttons = Array.from(document.querySelectorAll('button'));
        const runButton = buttons.find((button) => /^Run\\b/i.test(normalize(button.innerText || button.textContent)));
        if (!runButton) return false;
        runButton.click();
        return true;
      })()
    `);
    return Boolean(clicked);
  } finally {
    await client.close();
  }
}

async function maybeApproveCommandInput(config: BridgeConfig): Promise<boolean> {
  const client = await createCdpClient(config);
  try {
    const clicked = await client.evaluate<boolean>(`
      (() => {
        const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
        const bodyText = normalize(document.body.innerText || '');
        const shouldSendY =
          /Ok to proceed\\?\\s*\\(y\\)/i.test(bodyText) ||
          /Need to install the following packages/i.test(bodyText);

        const fields = Array.from(document.querySelectorAll('textarea, input:not([type="file"]), [contenteditable="true"], [role="textbox"]'));
        for (const field of fields) {
          if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
            if (shouldSendY && !normalize(field.value)) {
              field.focus();
              field.value = 'y';
              field.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'y', inputType: 'insertText' }));
            }
          } else if (shouldSendY && field instanceof HTMLElement && field.isContentEditable && !normalize(field.innerText || field.textContent)) {
            field.focus();
            field.innerText = 'y';
            field.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'y', inputType: 'insertText' }));
          }
        }

        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptButton = buttons.find((button) => /^Accept\\b/i.test(normalize(button.innerText || button.textContent)));
        if (!acceptButton) return false;
        acceptButton.click();
        return true;
      })()
    `);
    return Boolean(clicked);
  } finally {
    await client.close();
  }
}

async function maybeApproveAllowConversation(config: BridgeConfig): Promise<boolean> {
  const client = await createCdpClient(config);
  try {
    const clicked = await client.evaluate<boolean>(`
      (() => {
        const normalize = (value) => String(value || '').replace(/\\s+/g, ' ').trim();
        const bodyText = normalize(document.body.innerText || '');
        if (!/Allow directory access to/i.test(bodyText) || !/Allow This Conversation/i.test(bodyText)) {
          return false;
        }

        const buttons = Array.from(document.querySelectorAll('button'));
        const allowConversationButton = buttons.find((button) =>
          /^Allow This Conversation$/i.test(normalize(button.innerText || button.textContent))
        );
        if (!allowConversationButton) return false;
        allowConversationButton.click();
        return true;
      })()
    `);
    return Boolean(clicked);
  } finally {
    await client.close();
  }
}

async function tryUiTransport(
  stateFile: string,
  config: BridgeConfig
): Promise<ExecuteResult> {
  const state = await readState(stateFile);
  const bridgePrompt = buildBridgePrompt(state.prompt, config);

  if (state.model) {
    const modelResult = await runOpencli(config, ['antigravity', 'model', state.model], 15000);
    if (modelResult.exitCode !== 0) {
      throw new Error(modelResult.stderr || modelResult.stdout || `Failed to switch model to ${state.model}`);
    }
  }

  const before = await readConversation(config, true);
  await sendPrompt(config, bridgePrompt);

  let lastDelta = '';
  let stableCount = 0;
  const startedAt = Date.now();

  while (Date.now() - startedAt < state.timeoutMs) {
    await sleep(config.pollIntervalMs);
    const conversation = await readConversation(config, true);
    const delta = finalizeAssistantOutput(
      extractConversationDelta(before, conversation, bridgePrompt),
      config
    );

    if (config.autoApproveAllowConversation && hasPendingAllowConversation(conversation)) {
      const approved = await maybeApproveAllowConversation(config);
      if (approved) {
        emitStatus('Detected Allow This Conversation prompt and auto-approved it');
        await sleep(1000);
      }
    }

    if (config.autoApproveRunCommands && hasPendingRunPrompt(conversation)) {
      const approved = await maybeApproveRunPrompt(config);
      if (approved) {
        emitStatus('Detected pending Run command and auto-approved it');
        await sleep(1000);
      }
    }

    if (config.autoApproveRunCommands && hasPendingCommandInput(conversation)) {
      const approved = await maybeApproveCommandInput(config);
      if (approved) {
        emitStatus('Detected pending command input and auto-accepted it');
        await sleep(1000);
      }
    }

    if (delta && delta !== lastDelta) {
      const current = await readState(stateFile);
      await fs.writeFile(current.outputFile, delta, 'utf8');
      lastDelta = delta;
      stableCount = 0;
    } else if (delta && delta === lastDelta) {
      stableCount += 1;
    }

    await updateState(stateFile, (current) => ({
      ...current,
      status: 'running',
      heartbeat: nowIso()
    }));

    if (
      delta &&
      stableCount >= config.stablePolls &&
      !hasPendingRunPrompt(conversation) &&
      !hasPendingAllowConversation(conversation)
    ) {
      return { transportUsed: 'ui', output: delta };
    }
  }

  throw new Error(`UI adapter timed out after ${Math.round(state.timeoutMs / 1000)}s`);
}

export async function executeRun(stateFile: string, config: BridgeConfig): Promise<ExecuteResult> {
  const state = await readState(stateFile);
  const transportOrder: Array<'serve' | 'ui'> =
    state.transport === 'serve'
      ? ['serve']
      : state.transport === 'ui'
        ? ['ui']
        : ['serve', 'ui'];

  const errors: string[] = [];
  for (const transport of transportOrder) {
    try {
      emitStatus(`Trying ${transport} transport`);
      if (transport === 'serve') {
        return await tryServeTransport(stateFile, config);
      }
      return await tryUiTransport(stateFile, config);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${transport}: ${message}`);
      await appendError(stateFile, `[${nowIso()}] ${transport} failed: ${message}\n`);
    }
  }

  throw new Error(`All transports failed: ${errors.join(' | ')}`);
}
