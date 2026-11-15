// What the factory costs to run, for the processes agent's weekly cost check (D-558):
// the slowest unit-test files, the text every session or agent loads before doing anything, the docs too
// big to read whole, and how long the PR checks take on GitHub. It only measures; what to do about it,
// and the rule that nothing may lose coverage, quality or speed for players, are in processes.md.
//   node tools/agents/costs.mjs            all of it (runs the unit tests once, ~20 s)
//   node tools/agents/costs.mjs --no-tests without the test timing
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const kb = f => (statSync(join(ROOT, f)).size / 1024).toFixed(1);
const sh = (cmd, args, env = {}) => { try { return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return e.stdout || ''; } };

console.log('## Always loaded (KB): every session reads CLAUDE.md, each agent its file');
for (const f of ['CLAUDE.md', ...readdirSync(join(ROOT, '.claude/agents')).filter(n => n.endsWith('.md')).map(n => `.claude/agents/${n}`)])
  console.log(`  ${kb(f).padStart(6)}  ${f}`);

console.log('\n## Docs over 40 KB: read in parts (grep, offset) or split by topic');
const docs = [];
const walk = d => { for (const n of readdirSync(join(ROOT, d))) { const p = `${d}/${n}`; if (statSync(join(ROOT, p)).isDirectory()) walk(p); else if (n.endsWith('.md') && statSync(join(ROOT, p)).size > 40 * 1024) docs.push(p); } };
walk('docs');
for (const f of docs.sort((a, b) => statSync(join(ROOT, b)).size - statSync(join(ROOT, a)).size)) console.log(`  ${kb(f).padStart(6)}  ${f}`);

if (!process.argv.includes('--no-tests')) {
  console.log('\n## Unit tests: the whole suite and its slowest files (the slowest sets the floor)');
  const t = Date.now();
  const out = sh('node', ['tools/release/run-tests.mjs'], { TIMES: '8', GITHUB_ACTIONS: '' });
  console.log(out.split('\n').filter(l => /passed|^\s+[\d.]+ s/.test(l)).join('\n'));
  console.log(`  wall: ${((Date.now() - t) / 1000).toFixed(1)} s`);
}

console.log('\n## PR checks on GitHub: median minutes of the last 20 successful runs');
for (const wf of ['tests.yml', 'e2e.yml']) {
  const runs = JSON.parse(sh('gh', ['run', 'list', '--workflow', wf, '--status', 'success', '--limit', '20', '--json', 'startedAt,updatedAt']) || '[]');
  const m = runs.map(r => (new Date(r.updatedAt) - new Date(r.startedAt)) / 60000).sort((a, b) => a - b);
  console.log(`  ${wf.padEnd(10)} ${m.length ? m[m.length >> 1].toFixed(1) + ' min' : 'no data (gh not signed in?)'}`);
}
