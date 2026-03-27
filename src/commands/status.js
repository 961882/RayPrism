/**
 * rayprism status — Show current project info
 */

import { existsSync, readFileSync, lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { log, C } from '../utils/logger.js';
import { getTemplateVersion } from '../utils/template.js';

export async function status() {
  const configPath = join(process.cwd(), '.rayprism.json');
  if (!existsSync(configPath)) {
    log.err('当前目录不是 RayPrism 项目（缺少 .rayprism.json）');
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8'));

  console.log('');
  console.log(C.bold('📋 RayPrism 项目信息'));
  console.log('══════════════════════════════════');
  console.log(`  项目名称 : ${config.name || '?'}`);
  console.log(`  分支类型 : ${config.branch || '?'}`);
  console.log(`  框架来源 : ${config.source || '?'}`);
  console.log(`  模板版本 : ${config.template_version || '?'}`);
  console.log(`  创建时间 : ${config.created || '?'}`);

  // Version comparison
  const currentVer = config.template_version || '?';
  let latestVer = '?';
  if (config.source && existsSync(join(config.source, 'VERSION'))) {
    latestVer = readFileSync(join(config.source, 'VERSION'), 'utf8').trim();
  }

  console.log('');
  if (currentVer === latestVer) {
    console.log(C.green(`  模板版本 : v${currentVer} ✅ 已是最新`));
  } else {
    console.log(C.yellow(`  模板版本 : v${currentVer} → v${latestVer} (可运行 rayprism upgrade)`));
  }

  // Framework symlink
  console.log('');
  const fwPath = join(process.cwd(), 'framework');
  if (existsSync(fwPath) && lstatSync(fwPath).isSymbolicLink()) {
    const { readlinkSync } = await import('node:fs');
    const target = readlinkSync(fwPath);
    console.log(`  ${C.green('framework/')} → ${target}`);
  } else {
    console.log(`  ${C.yellow('framework/')} (非符号链接，升级无效)`);
  }

  // Overrides status
  const overridesPath = join(process.cwd(), 'overrides');
  if (existsSync(overridesPath)) {
    const rulesDir = join(overridesPath, 'rules');
    const skillsDir = join(overridesPath, 'skills');
    let ruleCount = 0, skillCount = 0;
    try {
      ruleCount = readdirSync(rulesDir).filter(f => f.endsWith('.md')).length;
    } catch {}
    try {
      skillCount = readdirSync(skillsDir).filter((_, i, arr) => {
        // count directories only
        return true;
      }).length;
    } catch {}
    console.log(`  ${C.cyan('overrides/')}  规则: ${ruleCount}, Skills: ${skillCount}`);
  }

  console.log('');
}
