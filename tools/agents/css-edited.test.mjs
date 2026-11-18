import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCss, hits } from './css-edited.mjs';

test('isCss sees stylesheets only', () => {
  assert.ok(isCss('/a/public/x/style.css'));
  assert.ok(!isCss('/a/public/x/game.js'));
  assert.ok(!isCss(undefined));
});

test('hits returns the lint lines only when it found something', () => {
  const lint = out => () => ({ status: 0, stdout: out });
  assert.deepEqual(hits('/r/a.css', '/r', lint('0 hits not allowlisted in 0 files\n')), []);
  const h = hits('/r/a.css', '/r', lint('\na.css\n  :1    space        margin: 13px\n        → --s-12 (12)\n\n1 hits not allowlisted in 1 files\n'));
  assert.equal(h.length, 3);
  assert.match(h[1], /margin: 13px/);
  assert.deepEqual(hits('/r/a.css', '/r', () => ({ error: new Error('x') })), []);
});

test('.claude/settings.json runs it after edits', () => {
  const s = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const h = (s.hooks.PostToolUse || []).find(x => /Edit/.test(x.matcher) && /Write/.test(x.matcher));
  assert.ok(h && h.hooks.some(x => x.command.includes('tools/agents/css-edited.mjs')));
});
