/**
 * rayprism upgrade — Update framework symlinks to latest
 */

import { existsSync, readFileSync, writeFileSync, rmSync, symlinkSync, readdirSync, lstatSync, readlinkSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { log, C } from '../utils/logger.js';
import { ensureFramework, getTemplateVersion } from '../utils/template.js';
import { BRANCHES_DIR } from '../utils/constants.js';
import { registerProject } from '../utils/registry.js';
import { linkHiddenDirs } from './init.js';

export async function upgrade() {
  const configPath = join(process.cwd(), '.rayprism.json');
  if (!existsSync(configPath)) {
    log.err('当前目录不是 RayPrism 项目（缺少 .rayprism.json）');
  }

  // Force re-download templates
  await ensureFramework({ force: true });

  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const branch = config.branch;
  const branchDir = join(BRANCHES_DIR, branch);
  const currentVer = config.template_version || '?';
  const latestVer = getTemplateVersion(branch);

  if (currentVer === latestVer) {
    log.info(`模板已是最新版本: v${currentVer}`);
  } else {
    log.info(`版本变更: v${currentVer} → v${latestVer}`);
  }

  // Re-link framework/
  log.info(`重新链接 framework → ${branchDir}`);
  const fwPath = join(process.cwd(), 'framework');
  if (existsSync(fwPath)) rmSync(fwPath, { force: true });
  symlinkSync(branchDir, fwPath);

  // Re-link hidden dirs
  linkHiddenDirs(branch, branchDir, process.cwd());

  // Update .rayprism.json
  config.template_version = latestVer;
  config.source = branchDir;
  writeFileSync(configPath, JSON.stringify(config, null, 2));
  log.ok(`模板版本已更新为 v${latestVer}`);

  // Update registry
  registerProject({
    name: config.name,
    branch,
    path: process.cwd(),
    source: branchDir,
    templateVersion: latestVer,
  });

  log.ok('框架已更新至最新版本');
}
