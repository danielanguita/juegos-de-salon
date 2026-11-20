// scope-guard.mjs (D-597): each scoped agent edits only its own files, and the hook is wired in settings.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCOPES, verdict } from './scope-guard.mjs';

const root = '/r/juegos/.claude/worktrees/x';

test('documentation edits docs and the app messages, not app code', () => {
  assert.equal(verdict('documentation', `${root}/docs/games/hangman.md`, root), null);
  assert.equal(verdict('documentation', `${root}/README.md`, root), null);
  assert.equal(verdict('documentation', `${root}/public/assets/js/i18n.js`, root), null);
  assert.match(verdict('documentation', `${root}/public/hangman/game.js`, root), /D-597/);
  assert.match(verdict('documentation', `${root}/firebase/database.rules.json`, root), /outside/);
  assert.match(verdict('documentation', `${root}/README.md.bak`, root), /outside/);
});

test('ideas and retention only write docs and changelog', () => {
  for (const a of ['ideas', 'retention']) {
    assert.equal(verdict(a, `${root}/docs/ideas.json`, root), null);
    assert.equal(verdict(a, `${root}/changelog/x.md`, root), null);
    assert.match(verdict(a, `${root}/public/index.html`, root), /outside/);
  }
});

test('files outside the repo and unscoped agents pass', () => {
  assert.equal(verdict('documentation', '/tmp/scratch.md', root), null);
  assert.equal(verdict('usability', `${root}/public/index.html`, root), null);
});

test('the guard is wired in settings.json for every edit tool', () => {
  const settings = JSON.parse(readFileSync(new URL('../../.claude/settings.json', import.meta.url), 'utf8'));
  const hook = settings.hooks.PreToolUse.find(h => h.hooks.some(x => x.command.includes('scope-guard.mjs')));
  assert.ok(hook, 'scope-guard.mjs is a PreToolUse hook (D-597)');
  assert.equal(hook.matcher, 'Edit|Write|NotebookEdit');
});
