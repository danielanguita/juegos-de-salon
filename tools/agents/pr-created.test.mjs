import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { isPrCreate, prNumber, reminder } from './pr-created.mjs';

test('isPrCreate sees gh pr create, not other gh commands', () => {
  assert.ok(isPrCreate('gh pr create --title x'));
  assert.ok(isPrCreate('cd a && gh pr create --fill'));
  assert.ok(!isPrCreate('gh pr view 3'));
  assert.ok(!isPrCreate('echo "gh pr created"'));
});

test('prNumber reads the URL gh prints', () => {
  assert.equal(prNumber('https://github.com/o/r/pull/1552\n'), 1552);
  assert.equal(prNumber('error'), null);
});

test('reminder names the lane, the tick, auto-merge and watching, with the number', () => {
  const r = reminder(7);
  for (const s of ['lanes.mjs check', 'lanes.mjs tick 7', 'merge 7 --auto', 'wait-pr.mjs 7', 'subscribe_pr_activity', 'player agent']) assert.ok(r.includes(s), s);
});

test('the hook prints context only after a PR was created', () => {
  const run = input => spawnSync('node', ['tools/agents/pr-created.mjs'], { input: JSON.stringify(input), encoding: 'utf8' }).stdout;
  const out = JSON.parse(run({ tool_input: { command: 'gh pr create --fill' }, tool_response: { stdout: 'https://github.com/o/r/pull/9\n' } }));
  assert.equal(out.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.match(out.hookSpecificOutput.additionalContext, /#9/);
  assert.equal(run({ tool_input: { command: 'gh pr view 9' }, tool_response: { stdout: 'https://github.com/o/r/pull/9' } }), '');
  assert.equal(run({ tool_input: { command: 'gh pr create' }, tool_response: { stdout: 'failed' } }), '');
});

test('.claude/settings.json runs the reminder after Bash', () => {
  const s = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const cmds = (s.hooks.PostToolUse || []).filter(h => h.matcher === 'Bash').flatMap(h => h.hooks.map(x => x.command));
  assert.ok(cmds.some(c => c.includes('tools/agents/pr-created.mjs')));
});
