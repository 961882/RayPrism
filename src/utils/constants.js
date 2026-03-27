/**
 * Branch metadata and path constants
 */

import { homedir } from 'node:os';
import { join } from 'node:path';

// ─── Paths ──────────────────────────────────────────────────────────
export const RAYPRISM_CACHE = join(homedir(), '.rayprism');
export const FRAMEWORK_DIR = join(RAYPRISM_CACHE, 'framework');
export const BRANCHES_DIR = join(FRAMEWORK_DIR, 'branches');
export const REGISTRY_FILE = join(RAYPRISM_CACHE, 'registry.json');
export const DEFAULT_PROJECTS_DIR = join(homedir(), 'Projects');

export const GITHUB_REPO = '961882/RayPrism';
export const GITHUB_TARBALL = `https://github.com/${GITHUB_REPO}/archive/refs/heads/main.tar.gz`;

// ─── Branch definitions ─────────────────────────────────────────────
export const VALID_BRANCHES = ['pro', 'ink', 'dev', 'ops'];

export const BRANCH_META = {
  pro:     { desc: '专业文档 / 策略规划 / 分析报告',   dirs: 'reports strategy analysis drafts references' },
  ink:     { desc: '内容创作 / 公众号 / 社媒运营',     dirs: 'drafts published assets scheduled archive' },
  dev:     { desc: '软件开发 / 代码 / 架构设计',       dirs: 'src docs tests artifacts experiments' },
  ops:     { desc: '运维 / 自动化 / 系统管理',         dirs: 'scripts configs runbooks logs incidents' },
};

export const WORKSPACE_DIR_DESC = {
  reports: '分析报告', strategy: '策略文档', analysis: '分析草稿',
  drafts: '草稿、初稿', references: '参考资料', published: '已发布内容',
  assets: '素材、图片', scheduled: '待发内容', archive: '历史归档',
  src: '源代码', docs: '文档', tests: '测试',
  artifacts: '构建产物', experiments: '实验代码',
  scripts: '自动化脚本', configs: '配置文件', runbooks: '操作手册',
  logs: '日志记录', incidents: '故障记录', output: '最终产出',
};
