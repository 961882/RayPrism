/**
 * Template download & cache management
 *
 * Downloads the RayPrism repo tarball from GitHub and extracts it to
 * ~/.rayprism/framework/. Supports forced refresh for upgrade.
 */

import { existsSync, mkdirSync, rmSync, createWriteStream, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { FRAMEWORK_DIR, BRANCHES_DIR, GITHUB_TARBALL, RAYPRISM_CACHE } from './constants.js';
import { log } from './logger.js';

/**
 * Ensure framework templates are cached locally.
 * @param {object} opts
 * @param {boolean} opts.force - Force re-download even if cached
 * @returns {string} Path to BRANCHES_DIR
 */
export async function ensureFramework({ force = false } = {}) {
  if (!force && existsSync(BRANCHES_DIR)) {
    return BRANCHES_DIR;
  }

  log.info('正在从 GitHub 下载 RayPrism 模板...');
  mkdirSync(RAYPRISM_CACHE, { recursive: true });

  const tarPath = join(RAYPRISM_CACHE, 'main.tar.gz');

  // Download tarball
  const res = await fetch(GITHUB_TARBALL, { redirect: 'follow' });
  if (!res.ok) {
    log.err(`下载失败: HTTP ${res.status} — ${GITHUB_TARBALL}`);
  }

  // Save to file
  const fileStream = createWriteStream(tarPath);
  await pipeline(res.body, fileStream);

  // Remove old framework dir
  if (existsSync(FRAMEWORK_DIR)) {
    rmSync(FRAMEWORK_DIR, { recursive: true, force: true });
  }

  // Extract using system tar (works on macOS/Linux, simpler than node tar)
  mkdirSync(FRAMEWORK_DIR, { recursive: true });
  execSync(`tar -xzf "${tarPath}" --strip-components=1 -C "${FRAMEWORK_DIR}"`, {
    stdio: 'pipe',
  });

  // Clean up tarball
  rmSync(tarPath, { force: true });

  // Write download timestamp
  const metaPath = join(RAYPRISM_CACHE, 'meta.json');
  const meta = {
    downloaded_at: new Date().toISOString(),
    source: GITHUB_TARBALL,
  };
  const { writeFileSync } = await import('node:fs');
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  log.ok('模板下载完成 → ~/.rayprism/framework/');
  return BRANCHES_DIR;
}

/**
 * Get the RayPrism version (single source of truth: package.json).
 */
export function getVersion() {
  const pkgPath = join(fileURLToPath(import.meta.url), '..', '..', '..', 'package.json');
  if (existsSync(pkgPath)) {
    return JSON.parse(readFileSync(pkgPath, 'utf8')).version;
  }
  return '0.0.0';
}
