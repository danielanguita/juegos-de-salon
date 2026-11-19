import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isPush, problems, pushDir, missingChangelog } from './push-guard.mjs';

test('isPush sees a git push, not other commands', () => {
  assert.ok(isPush('git push -u origin x'));
  assert.ok(isPush('cd a && git push'));
  assert.ok(isPush('git -C ../wt push origin b'));
  assert.ok(!isPush('git pushd'));
  assert.ok(!isPush('git status'));
  assert.ok(!isPush('echo "do not push"'));
});

test('problems names the stale index and the stale README block', () => {
  const run = (cmd, args) => cmd === 'node'
    ? { status: /design-lint|landing-stamp|document/.test(args[0]) ? 0 : 1, stdout: '' }
    : { status: 1, stdout: 'ERROR · the block "tests" went stale  →  python3 tools/release/readme.py update\nERROR · screenshot x outdated\n' };
  const found = problems(process.cwd(), run);
  assert.equal(found.length, 2);
  assert.match(found[0], /decision\.mjs index/);
  assert.match(found[1], /block "tests"/);
  assert.doesNotMatch(found[1], /screenshot/);
});

test('problems names a decision file document.test.mjs would fail (#1492, #1574)', () => {
  const bad = 'D-583 has the topic "games", which is not in docs/decisions/topics.json';
  const run = (cmd, args) => cmd === 'node' && args[0].includes('document.mjs')
    ? { status: 1, stdout: `✗ ${bad}\n` } : { status: 0, stdout: '' };
  const found = problems(process.cwd(), run);
  assert.equal(found.length, 1);
  assert.match(found[0], /document\.test\.mjs/);
  assert.ok(found[0].includes(bad));
});

test('the real decisions check runs and is clean on this repo', async () => {
  const { decisionProblems } = await import('./document.mjs');
  assert.deepEqual(decisionProblems(), []);
});

test('problems names a design-lint gate failure', () => {
  const run = (cmd, args) => ({ status: cmd === 'node' && args[0].includes('design-lint') ? 1 : 0, stdout: '' });
  const found = problems(process.cwd(), run);
  assert.equal(found.length, 1);
  assert.match(found[0], /design-lint\.mjs --gate/);
});

test('problems names a cover changed without its landing-fold run (#1624, #1629)', () => {
  const msg = 'a cover changed without its landing-fold run on this content (labs/croc/): node tools/e2e/landing-fold.mjs --only croc';
  const run = (cmd, args) => ({ status: cmd === 'node' && args[0].includes('landing-stamp') ? 1 : 0, stdout: cmd === 'node' && args[0].includes('landing-stamp') ? `${msg}\n` : '' });
  const found = problems(process.cwd(), run);
  assert.deepEqual(found, [msg]);
});

test('problems is empty when everything is up to date', () => {
  assert.deepEqual(problems(process.cwd(), () => ({ status: 0, stdout: '' })), []);
});

test('.claude/settings.json runs the guard before Bash', () => {
  const s = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const cmds = (s.hooks.PreToolUse || []).filter(h => h.matcher === 'Bash').flatMap(h => h.hooks.map(x => x.command));
  assert.ok(cmds.some(c => c.includes('tools/agents/push-guard.mjs')));
});

test('pushDir checks the worktree a cd moved to, not the session folder (#1416, #1436)', () => {
  assert.equal(pushDir('git push', '/repo'), '/repo');
  assert.equal(pushDir('cd ../wt && git push -u origin b', '/repo'), '/wt');
  assert.equal(pushDir('cd "/tmp/a b" && git add . && git push', '/repo'), '/tmp/a b');
  assert.equal(pushDir('cd /x && cd y; git push', '/repo'), '/x/y');
  assert.equal(pushDir('git -C ../wt push origin b', '/repo'), '/wt');
  assert.equal(pushDir('git push && cd /elsewhere', '/repo'), '/repo');
});

test('missingChangelog asks for the entry only on a topic branch that brings changes without one (D-300)', () => {
  const git = (branch, diff, status = 0) => (cmd, args) => args[0] === 'rev-parse' ? { status: 0, stdout: `${branch}\n` } : { status, stdout: diff };
  assert.equal(missingChangelog(git('topic', 'public/a.js\n')).length, 1);
  assert.match(missingChangelog(git('topic', 'public/a.js\n'))[0], /changelog\.mjs new/);
  assert.deepEqual(missingChangelog(git('topic', 'public/a.js\nchangelog/topic.md\n')), []);
  assert.equal(missingChangelog(git('topic', 'changelog/README.md\n')).length, 1);
  assert.deepEqual(missingChangelog(git('topic', '')), []);
  assert.deepEqual(missingChangelog(git('main', 'public/a.js\n')), []);
  assert.deepEqual(missingChangelog(git('topic', 'x', 128)), []);
});
