#!/usr/bin/env node
/**
 * Críptico's clue bank, with the answers sealed (public/labs/cryptic/sealed.js; the owner, 2026-11-20).
 * clues.js never holds an answer or an explanation in plain text: the repo is public.
 *
 *   node tools/generators/cryptic-clues.mjs add < clue.json   one clue { c, a, k, d, x, by? }, sealed, at the end of the bank
 *   node tools/generators/cryptic-clues.mjs seal              seals any clue line still written in plain text
 *   node tools/generators/cryptic-clues.mjs list              the bank opened, to read in the terminal (never paste it in a PR)
 *
 * Write the clue.json in the scratchpad, outside the repo, and never name the answer in a branch, commit,
 * PR or changelog (docs/games/cryptic.md, «Keeping the answers hidden»).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { seal } from '../../public/labs/cryptic/sealed.js';

const FILE = fileURLToPath(new URL('../../public/labs/cryptic/clues.js', import.meta.url));
const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** A clue → its line in clues.js, sealed. */
export function line({ c, a, k, d, x, by }) {
  if (!c || !a || !k || !d || !x) throw new Error('a clue needs c, a, k, d and x');
  const author = by ? `, by: { n: ${q(by.n)}${by.j ? `, j: ${q(by.j)}` : ''} }` : '';
  return `  { c: ${q(c)}, k: ${q(k)}, d: ${q(d)}, s: ${q(seal({ a, x }))}${author} },`;
}

/** A clue line still in plain text (it has `a:`) → sealed; any other line as it was. */
export function sealLine(text) {
  const m = text.match(/^\s*(\{ c: .*\}),?\s*$/);
  if (!m || !/\ba: /.test(text)) return text;
  return line(Function(`return (${m[1]})`)());
}

const cmd = process.argv[2];
if (cmd === 'seal' || cmd === 'add') {
  let lines = readFileSync(FILE, 'utf8').split('\n').map(sealLine);
  if (cmd === 'add') {
    const clue = JSON.parse(readFileSync(0, 'utf8'));
    const end = lines.indexOf('];');
    lines.splice(end, 0, line(clue));
  }
  writeFileSync(FILE, lines.join('\n'));
  console.log(cmd === 'add' ? 'added, sealed: run node public/labs/cryptic/engine.test.mjs' : 'sealed');
} else if (cmd === 'list') {
  const { CLUES } = await import('../../public/labs/cryptic/clues.js');
  for (const [lang, bank] of Object.entries(CLUES)) bank.forEach((c, i) => console.log(`${lang} ${i + 1}. ${c.c} → ${c.a}`));
} else if (cmd) {
  console.error('commands: add, seal, list'); process.exit(1);
}
