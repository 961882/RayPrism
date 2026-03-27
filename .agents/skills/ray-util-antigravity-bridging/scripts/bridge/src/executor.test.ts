import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasPendingAllowConversation,
  parseOpencliReadTable,
  relativizePromptPaths
} from './executor.ts';

test('parseOpencliReadTable extracts content cells and preserves blank lines', () => {
  const raw = `
  antigravity/read
┌─────────┬──────────────────────────────┐
│ Role    │ Content                      │
├─────────┼──────────────────────────────┤
│ history │ Thought for 1s               │
│         │                              │
│         │ First paragraph              │
│         │                              │
│         │ Second paragraph             │
└─────────┴──────────────────────────────┘
1 items · 0.1s · antigravity/read
`;

  assert.equal(
    parseOpencliReadTable(raw),
    ['Thought for 1s', '', 'First paragraph', '', 'Second paragraph'].join('\n')
  );
});

test('parseOpencliReadTable returns empty string when no table rows exist', () => {
  assert.equal(parseOpencliReadTable('Error: fetch failed'), '');
});

test('relativizePromptPaths rewrites workspace paths to relative paths', () => {
  assert.equal(
    relativizePromptPaths(
      '检查 /Users/ray/Projects/test01/antigravity-bridge/src/executor.ts 和 /Users/ray/Projects/test01/.agents/skills/foo/SKILL.md',
      '/Users/ray/Projects/test01'
    ),
    '检查 ./antigravity-bridge/src/executor.ts 和 ./.agents/skills/foo/SKILL.md'
  );
});

test('relativizePromptPaths rewrites exact workspace root to dot', () => {
  assert.equal(
    relativizePromptPaths('目录是 /Users/ray/Projects/test01', '/Users/ray/Projects/test01'),
    '目录是 .'
  );
});

test('hasPendingAllowConversation detects directory approval prompt', () => {
  assert.equal(
    hasPendingAllowConversation(
      'Allow directory access to /Users/ray/Projects/test01/antigravity-bridge? Deny Allow Once Allow This Conversation'
    ),
    true
  );
});

test('hasPendingAllowConversation ignores unrelated allow buttons', () => {
  assert.equal(
    hasPendingAllowConversation('Allow Once\nRun command?\nAllow network access'),
    false
  );
});
