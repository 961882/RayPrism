/**
 * rayprism projects — List all registered projects
 */

import { existsSync } from 'node:fs';
import { loadRegistry } from '../utils/registry.js';
import { C } from '../utils/logger.js';

export async function projects() {
  const reg = loadRegistry();

  if (reg.projects.length === 0) {
    console.log('');
    console.log(C.yellow('暂无已注册的项目'));
    console.log('运行 rayprism init <branch> <name> 创建第一个项目');
    console.log('');
    return;
  }

  console.log('');
  console.log(C.bold(`📋 RayPrism 已注册项目 (${reg.projects.length})`));
  console.log('══════════════════════════════════════════════════════');

  for (const p of reg.projects) {
    const alive = existsSync(p.path) ? C.green('●') : C.red('○');
    const ver = p.template_version || '?';
    const name = p.name.padEnd(20);
    const branch = p.branch.padEnd(8);
    console.log(`  ${alive} ${name} ${branch} v${ver.padEnd(6)} ${p.path}`);
  }

  console.log('');
}
