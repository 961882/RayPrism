#!/usr/bin/env node

/**
 * rayprism — Multi-branch AI Agent Framework CLI
 *
 * Usage:
 *   rayprism init <branch> <name> [--path /dir]
 *   rayprism list
 *   rayprism projects
 *   rayprism status
 *   rayprism upgrade
 *   rayprism unregister <name>
 */

import { init } from '../src/commands/init.js';
import { list } from '../src/commands/list.js';
import { projects } from '../src/commands/projects.js';
import { status } from '../src/commands/status.js';
import { upgrade } from '../src/commands/upgrade.js';
import { unregister } from '../src/commands/unregister.js';
import { log } from '../src/utils/logger.js';

const HELP = `
\x1b[1mrayprism — Multi-branch AI Agent Framework\x1b[0m

命令：
  rayprism init <branch> <name> [--path /dir]            初始化新项目
  rayprism list                                          列出可用分支
  rayprism projects                                      列出所有已注册项目
  rayprism status                                        查看当前项目信息
  rayprism upgrade                                       更新框架符号链接
  rayprism unregister <name>                             从注册表移除项目

分支: pro | ink | dev | ops

示例：
  npx rayprism init dev my-app
  npx rayprism init ink my-blog
  rayprism list
  rayprism projects
`;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  try {
    switch (command) {
      case 'init': {
        const branch = args[1];
        const name = args[2];
        if (!branch || !name) {
          log.err('用法: rayprism init <branch> <name> [--path /dir]');
        }
        const opts = parseInitOpts(args.slice(3));
        await init(branch, name, opts);
        break;
      }
      case 'list':
        await list();
        break;
      case 'projects':
        await projects();
        break;
      case 'status':
        await status();
        break;
      case 'upgrade':
        await upgrade();
        break;
      case 'unregister': {
        const name = args[1];
        if (!name) log.err('用法: rayprism unregister <name>');
        await unregister(name);
        break;
      }
      case 'help':
      case '--help':
      case '-h':
        console.log(HELP);
        break;
      case '--version':
      case '-v': {
        const { readFileSync } = await import('node:fs');
        const { fileURLToPath } = await import('node:url');
        const { dirname, join } = await import('node:path');
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
        console.log(pkg.version);
        break;
      }
      default:
        log.err(`未知命令: '${command}'。运行 rayprism help 查看帮助`);
    }
  } catch (e) {
    if (e.message?.startsWith('EXIT:')) {
      process.exit(1);
    }
    console.error(e);
    process.exit(1);
  }
}

function parseInitOpts(args) {
  const opts = { path: '' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' && args[i + 1]) {
      opts.path = args[++i];
    }
  }
  return opts;
}

main();
