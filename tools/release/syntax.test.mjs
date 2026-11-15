// Every script the site serves parses (owner's request after a merge left a comment unopened in
// public/labs/bridges/game.js and the page went blank, D-340): each public/**/*.js is checked as a
// module with `node --check`, from a .mjs copy so Node reads it as one.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { availableParallelism } from 'node:os';
import { readdirSync, statSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = new URL('../../public/', import.meta.url).pathname;
const files = [];
const walk = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.js')) files.push(p); } };
walk(ROOT);
const tmp = mkdtempSync(join(tmpdir(), 'syntax-'));
const bad = [];
// The same `node --check` on each file, several at a time (one after another it took ~11 s); each gets its own copy
const check = promisify(execFile);
let next = 0;
await Promise.all(Array.from({ length: availableParallelism() }, async (_, w) => {
  while (next < files.length) {
    const f = files[next++], copy = join(tmp, `check-${w}.mjs`);
    copyFileSync(f, copy);
    try { await check(process.execPath, ['--check', copy]); }
    catch (e) { bad.push(`${f.slice(ROOT.length)}: ${String(e.stderr).split('\n').find(l => /Error/.test(l)) || 'syntax error'}`); }
  }
}));
bad.sort();
rmSync(tmp, { recursive: true, force: true });
if (bad.length) { console.error(`✗ ${bad.length} script(s) of the site don't parse:\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log(`✓ syntax: ${files.length} scripts of the site parse`);
