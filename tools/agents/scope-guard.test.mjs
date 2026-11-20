// scope-guard.mjs (D-597): each scoped agent edits only its own files, and every scoped agent declares the hook.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
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

test('every scoped agent declares the guard in its frontmatter', () => {
  const dir = new URL('../../.claude/agents/', import.meta.url);
  for (const f of readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const front = readFileSync(new URL(f, dir), 'utf8').split('---')[1] || '';
    const name = /^name:\s*(\S+)/m.exec(front)?.[1];
    const declares = front.includes(`scope-guard.mjs ${name}`);
    assert.equal(declares, name in SCOPES, `${f}: ${name in SCOPES ? 'missing' : 'unexpected'} scope-guard hook (D-597)`);
  }
});
