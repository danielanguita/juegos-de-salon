// What the factory costs to run, for the processes agent's weekly cost check (D-558):
// the slowest unit-test files, the text every session or agent loads before doing anything, the docs too
// big to read whole, and how long the PR checks take on GitHub. It only measures; what to do about it,
// and the rule that nothing may lose coverage, quality or speed for players, are in processes.md.
// What each number means and which levers exist (and which the repo can't move) is in docs/COSTS.md.
//   node tools/agents/costs.mjs            all of it (runs the unit tests once, ~20 s)
//   node tools/agents/costs.mjs --no-tests without the test timing
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { DURATIONS, TARGET_S } from '../e2e/groups.mjs';
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

console.log('\n## PR checks on GitHub: median minutes of the last 20 successful runs (the slower one sets time-to-merge)');
for (const wf of ['tests.yml', 'e2e.yml']) {
  const runs = JSON.parse(sh('gh', ['run', 'list', '--workflow', wf, '--status', 'success', '--limit', '20', '--json', 'startedAt,updatedAt']) || '[]');
  const m = runs.map(r => (new Date(r.updatedAt) - new Date(r.startedAt)) / 60000).sort((a, b) => a - b);
  console.log(`  ${wf.padEnd(10)} median ${m.length ? m[m.length >> 1].toFixed(1) : '?'} min, slowest ${m.length ? m.at(-1).toFixed(1) : '?'} min`);
}

console.log(`\n## End to end: a full run is as long as its longest script or the group target (${TARGET_S} s)`);
const dur = JSON.parse(readFileSync(DURATIONS, 'utf8'));
const total = Object.values(dur).reduce((a, b) => a + b, 0);
console.log(`  all scripts: ${(total / 60).toFixed(0)} min of browser time; the longest (split one with ci.mjs PARTS if it is over the target):`);
for (const [k, v] of Object.entries(dur).sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log(`  ${String(v).padStart(5)} s  ${k}${v > TARGET_S ? '  ⚠️ over the target' : ''}`);

console.log('\n## GitHub Actions, last 7 days: minutes by workflow (free on a public repo; what counts is waiting and the 20 runners)');
const week = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
const all = JSON.parse(sh('gh', ['run', 'list', '--limit', '1000', '--created', `>=${week}`, '--json', 'workflowName,startedAt,updatedAt']) || '[]');
const byWf = {};
for (const r of all) { const m = (new Date(r.updatedAt) - new Date(r.startedAt)) / 60000; byWf[r.workflowName] ??= { n: 0, m: 0 }; byWf[r.workflowName].n++; byWf[r.workflowName].m += m; }
for (const [k, v] of Object.entries(byWf).sort((a, b) => b[1].m - a[1].m).slice(0, 8)) console.log(`  ${v.m.toFixed(0).padStart(5)} min  ${String(v.n).padStart(4)} runs  ${k}`);
console.log('  (wall time per run; e2e runs many jobs at once, so its runner minutes are several times this)');

// Claude's tokens, from Claude Code's own transcripts on this machine (~/.claude/projects): the money.
// Every turn re-reads the whole context from the cache, so cost ≈ turns × context; the fixed start of
// each session is paid again on every one of its turns
const base = join(homedir(), '.claude/projects');
if (existsSync(base)) {
  console.log('\n## Claude tokens, last 14 days (this machine\'s sessions in this repo)');
  const since = Date.now() - 14 * 864e5, rows = [];
  const files = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? files(p) : f.endsWith('.jsonl') && statSync(p).mtimeMs >= since ? [p] : []; });
  for (const d of readdirSync(base).filter(d => d.includes('juegos-de-salon'))) for (const p of files(join(base, d))) {
    const r = { turns: 0, ctx: 0, out: 0, start: 0, sub: p.includes('subagents'), job: false };
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      let e; try { e = JSON.parse(line); } catch { continue; }
      if (!r.turns && e.type === 'user' && typeof e.message?.content === 'string' && /unattended/.test(e.message.content)) r.job = true;
      const u = e.message?.usage; if (e.type !== 'assistant' || !u) continue;
      const c = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      if (!r.turns) r.start = c;
      r.turns++; r.ctx += c; r.out += u.output_tokens || 0;
    }
    if (r.turns) rows.push(r);
  }
  const M = x => (x / 1e6).toFixed(0) + 'M', K = x => (x / 1e3).toFixed(0) + 'k';
  const sum = (xs, f) => xs.reduce((a, x) => a + f(x), 0), all = sum(rows, r => r.ctx);
  const kinds = { 'interactive sessions': rows.filter(r => !r.sub && !r.job), 'scheduled jobs': rows.filter(r => r.job), 'subagents': rows.filter(r => r.sub) };
  for (const [k, xs] of Object.entries(kinds)) if (xs.length) console.log(`  ${k.padEnd(21)} ${String(xs.length).padStart(4)}  ${M(sum(xs, r => r.ctx)).padStart(6)} context read (${(100 * sum(xs, r => r.ctx) / all).toFixed(0)}%), ${K(sum(xs, r => r.ctx) / sum(xs, r => r.turns))} per turn, ${(sum(xs, r => r.turns) / xs.length).toFixed(0)} turns per session`);
  const main = kinds['interactive sessions'].sort((a, b) => b.ctx - a.ctx), starts = main.map(r => r.start).sort((a, b) => a - b);
  if (main.length) {
    console.log(`  a session starts at ${K(starts[starts.length >> 1])} (median) before any work: the repo's share is CLAUDE.md, memory and the agent and skill lists`);
    const long = main.filter(r => r.turns > 300);
    console.log(`  sessions over 300 turns: ${long.length} of ${main.length}, ${(100 * sum(long, r => r.ctx) / sum(main, r => r.ctx)).toFixed(0)}% of the interactive tokens`);
  }
}
