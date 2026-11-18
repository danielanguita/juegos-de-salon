import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { blocked } from './worktree-guard.mjs';

const root = '/r/juegos';

test('blocks edits in the main folder (D-135)', () => {
  assert.ok(blocked('/r/juegos/public/index.html', root));
  assert.ok(blocked('/r/juegos/CLAUDE.md', root));
  assert.ok(blocked('/r/juegos/.claude/settings.json', root));
});

test('lets worktrees and files outside the repo through', () => {
  assert.ok(!blocked('/r/juegos/.claude/worktrees/x/public/index.html', root));
  assert.ok(!blocked('/r/juegos-other/a.md', root));
  assert.ok(!blocked('/home/u/.claude/projects/m/memory/a.md', root));
  assert.ok(!blocked(undefined, root));
});

test('.claude/settings.json runs the guard before edits', () => {
  const s = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  const h = (s.hooks.PreToolUse || []).find(x => /Edit/.test(x.matcher) && /Write/.test(x.matcher));
  assert.ok(h && h.hooks.some(x => x.command.includes('tools/agents/worktree-guard.mjs')));
});
