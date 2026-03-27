/**
 * rayprism init <branch> <name> [--path /dir]
 *
 * Full port of rp.sh cmd_init logic to Node.js.
 */

import {
  existsSync, mkdirSync, symlinkSync, writeFileSync,
  readFileSync, readdirSync, lstatSync, rmSync, readlinkSync, statSync,
} from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { log, C } from '../utils/logger.js';
import {
  VALID_BRANCHES, BRANCH_META, BRANCHES_DIR, WORKSPACE_DIR_DESC,
  DEFAULT_PROJECTS_DIR,
} from '../utils/constants.js';
import { ensureFramework, getVersion } from '../utils/template.js';
import { registerProject } from '../utils/registry.js';

// ─── Exported helper: link .agents/ .claude/ (merged mode) ──────────
export function linkHiddenDirs(branch, branchDir, projectDir) {
  // === .agents/skills/ merge ===
  const branchSkills = join(branchDir, '.agents', 'skills');
  if (existsSync(branchSkills)) {
    const targetSkills = join(projectDir, '.agents', 'skills');
    mkdirSync(targetSkills, { recursive: true });

    // Remove old framework symlinks (preserve local dirs)
    if (existsSync(targetSkills)) {
      for (const item of readdirSync(targetSkills)) {
        const p = join(targetSkills, item);
        if (lstatSync(p).isSymbolicLink()) rmSync(p);
      }
    }

    // Link framework skills
    for (const skillName of readdirSync(branchSkills)) {
      const skillDir = join(branchSkills, skillName);
      if (!statSync(skillDir).isDirectory()) continue;

      const overridePath = join(projectDir, 'overrides', 'skills', skillName);
      if (existsSync(overridePath)) {
        symlinkSync(resolve(overridePath), join(targetSkills, skillName));
        log.info(`  skills/${skillName} → overrides/ (本地覆盖)`);
      } else {
        symlinkSync(resolve(skillDir), join(targetSkills, skillName));
      }
    }

    // Link extra override skills
    const overrideSkillsDir = join(projectDir, 'overrides', 'skills');
    if (existsSync(overrideSkillsDir)) {
      for (const skillName of readdirSync(overrideSkillsDir)) {
        const target = join(targetSkills, skillName);
        if (!existsSync(target)) {
          symlinkSync(resolve(join(overrideSkillsDir, skillName)), target);
        }
      }
    }

    log.ok('链接 .agents/skills/（框架 + 覆盖合并）');
  }

  // === .claude/rules/ merge ===
  const branchRules = join(branchDir, '.claude', 'rules');
  if (existsSync(branchRules)) {
    const targetRules = join(projectDir, '.claude', 'rules');
    mkdirSync(targetRules, { recursive: true });

    // Remove old framework symlinks
    if (existsSync(targetRules)) {
      for (const item of readdirSync(targetRules)) {
        const p = join(targetRules, item);
        if (lstatSync(p).isSymbolicLink()) rmSync(p);
      }
    }

    // Link framework rules
    for (const ruleName of readdirSync(branchRules)) {
      const ruleFile = join(branchRules, ruleName);
      if (!statSync(ruleFile).isFile()) continue;

      const overridePath = join(projectDir, 'overrides', 'rules', ruleName);
      if (existsSync(overridePath)) {
        symlinkSync(resolve(overridePath), join(targetRules, ruleName));
        log.info(`  rules/${ruleName} → overrides/ (本地覆盖)`);
      } else {
        symlinkSync(resolve(ruleFile), join(targetRules, ruleName));
      }
    }

    // Link extra override rules
    const overrideRulesDir = join(projectDir, 'overrides', 'rules');
    if (existsSync(overrideRulesDir)) {
      for (const ruleName of readdirSync(overrideRulesDir)) {
        const target = join(targetRules, ruleName);
        if (!existsSync(target)) {
          symlinkSync(resolve(join(overrideRulesDir, ruleName)), target);
        }
      }
    }

    log.ok('链接 .claude/rules/（框架 + 覆盖合并）');
  }
}

// ─── Generate AGENTS.md wrapper ─────────────────────────────────────
function writeAgentsMd(branch, projectName, branchDir, projectDir) {
  const dirs = BRANCH_META[branch].dirs.split(' ');
  const dirsTree = dirs.map(d => `├── ${d}/`).join('\n');

  let branchAgents = '';
  const branchAgentsPath = join(branchDir, 'AGENTS.md');
  if (existsSync(branchAgentsPath)) {
    branchAgents = readFileSync(branchAgentsPath, 'utf8')
      .split('\n')
      .filter(l => !l.startsWith('# '))
      .slice(0, 60)
      .join('\n');
  }

  const content = `# ${projectName} · AGENTS.md

> 本文件由 \`rayprism init\` 自动生成，适用于 Claude Code / Cursor / Gemini CLI 等 AI 工具。

## ⚠️ 框架只读声明（最高优先级）

\`framework/\` 目录是从 RayPrism \`${branch}\` 分支拉取的只读框架，  
**禁止修改 \`framework/\` 下的任何文件**。框架升级请运行 \`rayprism upgrade\`。

## 📂 产出目录约束

所有 AI 产出、生成内容、中间文件，**必须写入 \`workspace/\` 目录**，  
不得在项目根目录随意创建文件。

\`\`\`
workspace/
${dirsTree}
\`\`\`

## 🔧 自定义扩展

项目级规则放在 \`overrides/\` 目录：

- \`overrides/rules/*.md\` — 追加行为约束（自动合并到 .claude/rules/）
- \`overrides/skills/\` — 项目专属 Skills（自动合并到 .agents/skills/）
- 同名文件/目录会覆盖框架版本（本地优先）

## 📋 分支规则

本项目使用 **${branch}** 分支规则，详见：

\`\`\`
framework/AGENTS.md
\`\`\`

${branchAgents}
`;

  writeFileSync(join(projectDir, 'AGENTS.md'), content);
  log.ok('AGENTS.md 已生成（含只读声明 + 覆盖说明 + 框架规则）');
}

// ─── Main init command ──────────────────────────────────────────────
export async function init(branch, projectName, opts = {}) {
  // Validate branch
  if (!VALID_BRANCHES.includes(branch)) {
    log.err(`无效分支: '${branch}'。可用: ${VALID_BRANCHES.join(', ')}`);
  }

  // Ensure templates are downloaded
  await ensureFramework();

  const branchDir = join(BRANCHES_DIR, branch);
  if (!existsSync(branchDir)) {
    log.err(`分支目录不存在: ${branchDir}`);
  }

  // Determine project path
  const projectPath = opts.path || join(DEFAULT_PROJECTS_DIR, projectName);

  // Don't overwrite existing
  if (existsSync(projectPath)) {
    log.err(`目录已存在: ${projectPath}`);
  }

  const templateVer = getVersion();

  // Print banner
  console.log('');
  console.log(C.bold('🚀 RayPrism · 初始化新项目'));
  console.log('══════════════════════════════════');
  console.log(`  分支类型 : ${branch}  (${BRANCH_META[branch].desc})`);
  console.log(`  项目名称 : ${projectName}`);
  console.log(`  项目路径 : ${projectPath}`);
  console.log(`  框架来源 : ${branchDir}`);
  console.log(`  模板版本 : v${templateVer}`);
  console.log('');

  mkdirSync(projectPath, { recursive: true });

  // ① framework/ symlink
  symlinkSync(resolve(branchDir), join(projectPath, 'framework'));
  log.ok(`framework/ → ${branchDir}`);

  // ② overrides/ 目录
  mkdirSync(join(projectPath, 'overrides', 'rules'), { recursive: true });
  mkdirSync(join(projectPath, 'overrides', 'skills'), { recursive: true });
  writeFileSync(join(projectPath, 'overrides', 'README.md'), OVERRIDES_README);
  log.ok('overrides/ 目录结构已创建');

  // ③ Link hidden dirs (merge mode)
  linkHiddenDirs(branch, branchDir, projectPath);

  // ④ Link CLAUDE.md
  if (existsSync(join(branchDir, 'CLAUDE.md'))) {
    symlinkSync(join('framework', 'CLAUDE.md'), join(projectPath, 'CLAUDE.md'));
    log.ok('链接 CLAUDE.md');
  }

  // ⑤ workspace/ directories
  const dirs = BRANCH_META[branch].dirs.split(' ');
  for (const d of dirs) {
    mkdirSync(join(projectPath, 'workspace', d), { recursive: true });
  }
  log.ok('workspace/ 目录结构已创建');

  // ⑥ workspace/README.md
  const tableRows = dirs
    .map(d => `| \`${d}/\` | ${WORKSPACE_DIR_DESC[d] || '—'} |`)
    .join('\n');
  const wsReadme = `# Workspace\n\n所有项目产出放在此目录，框架规则在 \`../framework/\`（只读）。\n\n| 目录 | 用途 |\n|------|------|\n${tableRows}\n`;
  writeFileSync(join(projectPath, 'workspace', 'README.md'), wsReadme);
  log.ok('workspace/README.md 已生成');

  // ⑦ AGENTS.md
  writeAgentsMd(branch, projectName, branchDir, projectPath);

  // ⑧ .rayprism.json
  const config = {
    name: projectName,
    branch,
    source: branchDir,
    rayprism_home: resolve(join(BRANCHES_DIR, '..')),
    template_version: templateVer,
    created: new Date().toISOString(),
  };
  writeFileSync(join(projectPath, '.rayprism.json'), JSON.stringify(config, null, 2));
  log.ok(`.rayprism.json 元信息已写入（含模板版本 v${templateVer}）`);

  // ⑨ .gitignore
  writeFileSync(join(projectPath, '.gitignore'), GITIGNORE_CONTENT);
  log.ok('.gitignore 已创建');

  // ⑩ Register
  registerProject({
    name: projectName,
    branch,
    path: projectPath,
    source: branchDir,
    templateVersion: templateVer,
  });
  log.ok('已注册到全局注册表 (~/.rayprism/registry.json)');

  // ⑪ Post-init hook
  const hookPath = join(branchDir, 'post-init.sh');
  if (existsSync(hookPath)) {
    log.info(`执行 ${branch} post-init hook...`);
    try {
      execSync(`bash "${hookPath}"`, { cwd: projectPath, stdio: 'inherit' });
      log.ok('post-init hook 执行完成');
    } catch {
      log.warn('post-init hook 执行失败，跳过');
    }
  }


  // Done
  console.log('');
  console.log('══════════════════════════════════');
  log.ok('项目初始化完成！');
  console.log('');
  console.log(`  ${C.bold('下一步：')}`);
  console.log(`  cd ${projectPath}`);
  console.log('  用 Cursor / VS Code 打开即可');
  console.log('');
  console.log(`  ${C.cyan('产出路径')}   → workspace/`);
  console.log(`  ${C.yellow('框架路径')}   → framework/（只读，请勿修改）`);
  console.log(`  ${C.green('自定义扩展')} → overrides/（添加项目专属规则/Skills）`);
  console.log('');
}

// ─── Static content ─────────────────────────────────────────────────

const OVERRIDES_README = `# overrides/ — 项目级自定义扩展

此目录用于添加项目特有的规则和 Skills，不影响框架模板。

## 使用方法

### 追加行为规则

在 \`rules/\` 下新建 \`.md\` 文件，会自动合并到 \`.claude/rules/\`：

\`\`\`bash
cat > overrides/rules/my-project-rule.md << 'EOF'
---
description: 项目专属规则
---
- 所有报告必须包含数据来源链接
- 代码注释使用中文
EOF
\`\`\`

### 追加项目 Skills

在 \`skills/\` 下新建 skill 目录，会自动合并到 \`.agents/skills/\`：

\`\`\`
overrides/skills/
└── my-custom-skill/
    └── SKILL.md
\`\`\`

### 覆盖框架版本

如果本地文件与框架同名，本地版本优先（覆盖框架）。

### 生效方式

运行 \`rayprism upgrade\` 会重新合并框架 + overrides，自动生效。
`;

const GITIGNORE_CONTENT = `# 环境与系统
.env
.DS_Store

# 框架符号链接（不跟踪，由 rayprism upgrade 管理）
framework
.agents
.claude
CLAUDE.md

# 临时产出
workspace/logs/
workspace/incidents/
`;
