#!/usr/bin/env node
/**
 * 公众号终稿自动检查脚本
 * 用法: node scripts/auto-check.mjs <draft.md> [--profile practical|narrative]
 * 返回: JSON 检查报告，exit 0 = 通过, exit 2 = 不通过
 *
 * Profile 说明:
 *   practical (默认) — 实操干货体：禁破折号、短句优先
 *   narrative         — 叙事散文体：允许破折号、长句铺陈
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const profileArg = args.find((a) => a.startsWith('--profile'));
const profile = profileArg ? profileArg.split('=')[1] || args[args.indexOf(profileArg) + 1] || 'practical' : 'practical';

if (!file) {
  console.error('Usage: node scripts/auto-check.mjs <draft.md> [--profile practical|narrative]');
  process.exit(1);
}
if (!['practical', 'narrative'].includes(profile)) {
  console.error(`Unknown profile: ${profile}. Use "practical" or "narrative".`);
  process.exit(1);
}

const t = fs.readFileSync(file, 'utf8');

// ── 旁白句式检测（两个 Profile 共享） ──
const narrativeBanned = [
  // 开头禁用
  /在当今快速发展/, /随着.{2,6}的不断发展/, /众所周知/, /毋庸置疑/,
  /本文将/, /本文为您/,
  // 旁白禁用
  /这里不讲/, /后面再说/, /接下来我们/,
  /需要指出的是/, /值得注意的是/,
  // 结尾禁用
  /总而言之/, /综上所述/, /让我们拭目以待/,
  // 过渡禁用
  /与此同时/, /不仅如此/,
];
const narrativeHits = narrativeBanned.filter((r) => r.test(t)).map(String);

// ── AI 禁用词（两个 Profile 共享底线） ──
const aiBannedCN = [
  /深入探讨/, /赋能/, /助力/, /抓手/, /底层逻辑/,
  /颗粒度/, /打通/, /拉齐/, /沉淀/, /触达/,
  /赛道/, /范式/, /链路/, /心智/, /闭环/, /迭代/,
];
const aiBannedEN = [
  /\bdelve\b/i, /\bunleash\b/i, /\bharness\b/i,
  /\bleverage\b/i, /\brobust\b/i, /\bseamless\b/i,
  /\bgame.changer\b/i, /\bholistic\b/i,
];
const aiHitsCN = aiBannedCN.filter((r) => r.test(t)).map(String);
const aiHitsEN = aiBannedEN.filter((r) => r.test(t)).map(String);

// ── 破折号检测（仅 practical 模式判 fail） ──
const emDashCount = (t.match(/—/g) || []).length;

// ── 结构块检测 ──
const lines = t.split('\n');

const hasTitle = lines.some((l) => /^#{1,3}\s+.{2,}/.test(l)) || /标题/.test(t);

const hasHook = /钩子|开头|场景/.test(t) || (() => {
  const top = lines.slice(0, 15).filter((l) => l.trim() && !/^#|^>|^-|^\d/.test(l.trim()));
  return top.some((l) => l.length > 30);
})();

const hasCTA = /部署|代搭|回复.{0,4}领取|咨询|加群|扫码|关注|日志/.test(t);

const hasBody = t.length > 500;

const blocks = [
  { k: '标题', ok: hasTitle },
  { k: '开头钩子', ok: hasHook },
  { k: 'CTA', ok: hasCTA },
  { k: '正文', ok: hasBody },
];

// ── 可执行动作计数 ──
const actions = (t.match(/^[\s]*[-•]\s+\S|^\s*\d+[.、)）]\s+\S/gm) || []).length;

// ── A/B 标题检测 ──
const hasAB = /A\/?B|A版|B版|版A|版B|流量向|转化向|稳健向/.test(t);

// ── 价值最小单元检测 ──
const hasScenario = /场景|问题|困境|痛点|卡点/.test(t);
const hasPitfall = /踩坑|反例|失败|教训|错误|误区/.test(t);
const hasResult = /\d+%|\d+\s*(天|小时|分钟|元|万|倍)|提升|降低|缩短|节省/.test(t);

// ── narrative 专属检测 ──
const hasMetaphor = profile === 'narrative'
  ? /如.*般|如同|仿佛|恰似|那份|悄然|隐喻|喻体|好比/.test(t)
  : null;

// ── 综合判定 ──
let pass = true;
const failures = [];

if (narrativeHits.length > 0) {
  pass = false;
  failures.push(`旁白句式命中: ${narrativeHits.join(', ')}`);
}
if (aiHitsCN.length > 0) {
  pass = false;
  failures.push(`AI 禁用中文词命中: ${aiHitsCN.join(', ')}`);
}
if (aiHitsEN.length > 0) {
  pass = false;
  failures.push(`AI 禁用英文词命中: ${aiHitsEN.join(', ')}`);
}

// 破折号：practical 模式下判 fail，narrative 模式下仅报告
if (profile === 'practical' && emDashCount > 0) {
  pass = false;
  failures.push(`破折号出现 ${emDashCount} 次`);
}

for (const b of blocks) {
  if (!b.ok) {
    pass = false;
    failures.push(`缺少结构块: ${b.k}`);
  }
}
if (actions < 3) {
  pass = false;
  failures.push(`可执行动作仅 ${actions} 条，要求 ≥ 3`);
}
if (!hasAB) {
  pass = false;
  failures.push('未检测到 A/B 标题');
}

// 价值单元为 warning，不直接导致不通过但会报告
const valueWarnings = [];
if (!hasScenario) valueWarnings.push('未检测到问题场景');
if (!hasPitfall) valueWarnings.push('未检测到踩坑/反例');
if (!hasResult) valueWarnings.push('未检测到可验证结果');

// narrative 专属 warning
if (profile === 'narrative' && !hasMetaphor) {
  valueWarnings.push('未检测到隐喻/比喻体系（narrative 模式建议有贯穿全文的喻体）');
}

console.log(JSON.stringify({
  profile,
  pass,
  actions,
  hasAB,
  emDashCount,
  emDashRule: profile === 'practical' ? 'fail' : 'allow',
  narrativeHits,
  aiHitsCN,
  aiHitsEN,
  blocks,
  valueUnit: { hasScenario, hasPitfall, hasResult },
  ...(profile === 'narrative' ? { hasMetaphor } : {}),
  valueWarnings,
  failures,
}, null, 2));

process.exit(pass ? 0 : 2);
