import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { testsFor } from './stop-tests.mjs';

test('testsFor picks changed tests and the tests next to changed modules', () => {
  const have = new Set(['tools/a.test.mjs', 'tools/b.test.mjs', 'public/x.test.mjs']);
  const exists = f => have.has(f);
  assert.deepEqual(testsFor(['tools/a.mjs', 'tools/b.test.mjs', 'docs/x.md', 'tools/c.mjs', 'public/y.js'], exists), ['tools/a.test.mjs', 'tools/b.test.mjs']);
  assert.deepEqual(testsFor(['tools/gone.test.mjs'], exists), [], 'a deleted test is not run');
  assert.deepEqual(testsFor([], exists), []);
});

test('.claude/settings.json runs it on Stop', () => {
  const s = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  assert.ok((s.hooks.Stop || []).some(h => h.hooks.some(x => x.command.includes('tools/agents/stop-tests.mjs'))));
});
