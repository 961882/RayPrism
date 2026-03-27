/**
 * rayprism list — Show available branches
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { VALID_BRANCHES, BRANCH_META, BRANCHES_DIR } from '../utils/constants.js';
import { ensureFramework, getVersion } from '../utils/template.js';
import { C } from '../utils/logger.js';

export async function list() {
  await ensureFramework();

  console.log('');
  console.log(C.bold('📦 RayPrism 可用分支'));
  console.log('══════════════════════════════════');

  for (const b of VALID_BRANCHES) {
    const branchDir = join(BRANCHES_DIR, b);
    if (existsSync(branchDir)) {
      const ver = getVersion();
      console.log(`  ${C.green('●')} ${C.bold(b)} ${C.dim('v' + ver)}   ${BRANCH_META[b].desc}`);
    } else {
      console.log(`  ${C.yellow('○')} ${b}   (分支目录未找到)`);
    }
  }

  console.log('');
  console.log('用法: rayprism init <branch> <project-name>');
  console.log('');
}
