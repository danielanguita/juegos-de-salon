// The factory's numbers for the weekly report (learning piece 2, step 2.2): the agents measured like
// the players. Five metrics, each with the decision it informs (docs/learning/02-factory-metrics.md):
//   1. PRs merged and their median hours open, all and 🔴 (needs-owner) → relax or tighten a lane
//   2. Red CI runs per merged PR (tests + end-to-end) → what the ci-health agent works on
//   3. One-tap decisions opened, answered, median hours to answer → the owner's time
//   4. Agent PRs (documentation, usability, backlog, ci-health, feedback rounds) merged → which agent earns its keep
//   5. Reverts → mistakes that reached main
// No model, only GitHub: `gh` reads the public repo.
//   node tools/reports/factory.mjs [--days 7]
import { execFileSync } from 'node:child_process';

const HOUR = 36e5;
const median = xs => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const round1 = x => x === null ? null : Math.round(x * 10) / 10;
export const AGENT_BRANCH = /^(documentation|usability|backlog|ci-health|feedback|ideas|processes)[-/]/;

/** The five metrics from raw GitHub lists (pure, for the test). */
export function summarize({ prs, runs, decisions }) {
  const hours = p => (Date.parse(p.mergedAt) - Date.parse(p.createdAt)) / HOUR;
  const red = prs.filter(p => (p.labels || []).some(l => l.name === 'needs-owner'));
  const answered = decisions.filter(d => d.closedAt);
  const failed = runs.filter(r => r.conclusion === 'failure').length;
  return {
    merged: prs.length,
    hoursOpen: round1(median(prs.map(hours))),
    redMerged: red.length,
    redHoursOpen: round1(median(red.map(hours))),
    redRuns: failed,
    redRunsPerPr: prs.length ? round1(failed / prs.length) : null,
    decisionsOpened: decisions.length,
    decisionsAnswered: answered.length,
    decisionHours: round1(median(answered.map(d => (Date.parse(d.closedAt) - Date.parse(d.createdAt)) / HOUR))),
    agentPrs: prs.filter(p => AGENT_BRANCH.test(p.headRefName || '')).length,
    reverts: prs.filter(p => /^Revert\b/i.test(p.title || '')).length,
  };
}

/** The rows the report prints: [label, value]. */
export function rows(f) {
  const v = x => x ?? '—';
  return [
    ['PRs merged · median hours open', `${f.merged} · ${v(f.hoursOpen)} h`],
    ['🔴 PRs merged · median hours open', `${f.redMerged} · ${v(f.redHoursOpen)} h`],
    ['Red CI runs · per merged PR', `${f.redRuns} · ${v(f.redRunsPerPr)}`],
    ['One-tap decisions opened · answered · median hours', `${f.decisionsOpened} · ${f.decisionsAnswered} · ${v(f.decisionHours)} h`],
    ['Agent round PRs merged · reverts', `${f.agentPrs} · ${f.reverts}`],
  ];
}

const gh = (...a) => JSON.parse(execFileSync('gh', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64e6 }));

/** Reads GitHub for the `days` before `to` (a Date) and summarizes. */
export function factory(to = new Date(), days = 7) {
  const since = new Date(to.getTime() - days * 864e5).toISOString().slice(0, 10);
  const until = to.toISOString().slice(0, 10);
  const prs = gh('pr', 'list', '--state', 'merged', '--search', `merged:${since}..${until}`, '--limit', '500', '--json', 'number,title,createdAt,mergedAt,headRefName,labels');
  const runs = ['tests.yml', 'e2e.yml'].flatMap(w => { try { return gh('run', 'list', '--workflow', w, '--created', `${since}..${until}`, '--limit', '1000', '--json', 'conclusion'); } catch { return []; } });
  const decisions = gh('issue', 'list', '--state', 'all', '--label', 'processes', '--search', `created:${since}..${until}`, '--limit', '200', '--json', 'number,createdAt,closedAt');
  return summarize({ prs, runs, decisions });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf('--days');
  const f = factory(new Date(), i > 0 ? Number(process.argv[i + 1]) : 7);
  for (const [k, v] of rows(f)) console.log(`${k}: ${v}`);
}
