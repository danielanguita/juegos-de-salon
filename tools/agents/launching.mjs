#!/usr/bin/env node
/**
 * Which games does this change launch? (docs/LAUNCH.md §3, the gate in e2e.yml)
 *
 *   node tools/agents/launching.mjs [--base <ref>]     # default HEAD^1: in a PR's test merge, main
 *
 * Prints the ids, one line, space-separated (nothing when it launches none). A game launches in a change
 * when it was already in the lab behind its flag (`lanza`) at the base and its `nuevoDesde` (the launch
 * day) changed: that is the launch-day PR. The preparation PR (the game appears with its `lanza`) and the
 * cleanup PR (its `lanza` goes) do not count. The e2e workflow runs `launch-check.mjs <ids> --screens` on
 * them, so a game cannot launch with a place missing (Croc! and Tembleque, 2026-11-22).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The ids that `head` launches over `base` (two ALL_GAMES lists). */
export function launching(base, head) {
  const before = new Map(base.map(g => [g.id, g]));
  return head.filter(g => {
    const b = before.get(g.id);
    return !!b?.lanza && !!g.lanza && !!g.nuevoDesde && g.nuevoDesde !== b.nuevoDesde;
  }).map(g => g.id);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ROOT = fileURLToPath(new URL('../../', import.meta.url));
  const i = process.argv.indexOf('--base');
  const ref = i > 0 ? process.argv[i + 1] : 'HEAD^1';
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' });
  const dir = mkdtempSync(join(tmpdir(), 'launching-'));
  try {
    git('worktree', 'add', '--detach', '--quiet', dir, ref);
    const { ALL_GAMES: base } = await import(join(dir, 'public/assets/js/games.js'));
    const { ALL_GAMES: head } = await import(ROOT + 'public/assets/js/games.js');
    console.log(launching(base, head).join(' '));
  } finally {
    try { git('worktree', 'remove', '--force', dir); } catch { rmSync(dir, { recursive: true, force: true }); }
  }
}
