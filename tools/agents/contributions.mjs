#!/usr/bin/env node
/**
 * Outside contributions (D-568): which open PRs from outside (a fork, or anyone but the owner, the
 * same rule as lanes.mjs, D-519) need the contributions agent now. A cloud scheduled task runs the
 * agent every hour (tools/jobs/prompts/contributions.md); this script is its cheap first step, so a
 * round with nothing new ends in seconds, without reading any diff.
 *
 *   node tools/agents/contributions.mjs check            # the PRs to look at now, or "nothing to do"
 *   node tools/agents/contributions.mjs ready <n> <why>  # tells the owner a PR waits only for their Yes
 *
 * The agent remembers nothing between rounds: its state is its last comment on each PR, which ends
 * with a hidden marker `<!-- contributions: sha=<head> state=<reviewing|ready> -->`. A PR needs a
 * look when it has no marker yet, its head moved since the marker, or someone other than the agent
 * wrote after it. `ready` dispatches contrib-ready.yml, which comments as the workflows bot naming
 * the owner: GitHub notifies no one of what their own account does (the same reason as decide.yml).
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { outsideReason } from './lanes.mjs';

export const REPO = 'ellokojavi/juegos-de-salon';
const MARK = /<!-- contributions: sha=([0-9a-f]+) state=(reviewing|ready) -->/;
export const marker = (sha, state) => `<!-- contributions: sha=${sha} state=${state} -->`;

/**
 * Why a PR needs the agent now, or null. `comments` are the PR's conversation comments and reviews,
 * oldest first, each `{ body, at }`; the agent's own carry the marker.
 */
export function needsLook({ sha, comments = [] }) {
  let last = -1;
  comments.forEach((c, i) => { if (MARK.test(c.body || '')) last = i; });
  if (last < 0) return 'new: not reviewed yet';
  const [, seen, state] = comments[last].body.match(MARK);
  if (seen !== sha) return `new commits since the last review (${state})`;
  if (comments.slice(last + 1).some(c => (c.body || '').trim())) return 'a new comment since the last review';
  return null;
}

const gh = args => JSON.parse(execFileSync('gh', ['api', '--paginate', '--slurp', ...args], { encoding: 'utf8' })).flat();

function check() {
  const prs = gh([`repos/${REPO}/pulls?state=open&per_page=100`]);
  const todo = [];
  for (const pr of prs) {
    if (pr.draft || pr.user?.type === 'Bot') continue; // our own workflows' PRs are not contributions
    const files = gh([`repos/${REPO}/pulls/${pr.number}/files?per_page=100`]).map(f => f.filename);
    const outside = outsideReason(pr, files);
    if (!outside) continue;
    const comments = [
      ...gh([`repos/${REPO}/issues/${pr.number}/comments?per_page=100`])/* the bot's ready note is the agent's own word, not news */
        .filter(c => c.user?.login !== 'github-actions[bot]').map(c => ({ body: c.body, at: c.created_at })),
      ...gh([`repos/${REPO}/pulls/${pr.number}/reviews?per_page=100`]).map(c => ({ body: c.body, at: c.submitted_at })),
      ...gh([`repos/${REPO}/pulls/${pr.number}/comments?per_page=100`]).map(c => ({ body: c.body, at: c.created_at })),
    ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const why = needsLook({ sha: pr.head.sha, comments });
    if (why) todo.push({ number: pr.number, url: pr.html_url, author: pr.user.login, sha: pr.head.sha, outside, why });
  }
  if (!todo.length) { console.log('nothing to do'); return; }
  for (const t of todo) console.log(`${t.url} · @${t.author} · ${t.outside} · ${t.why} · head ${t.sha.slice(0, 7)}`);
}

function ready(n, why) {
  if (!/^\d+$/.test(n || '') || !why) throw new Error('Usage: node tools/agents/contributions.mjs ready <n> "<one line: what it brings and its risk>"');
  execFileSync('gh', ['workflow', 'run', 'contrib-ready.yml', '-R', REPO, '-f', `pr=${n}`, '-f', `summary=${why}`], { stdio: 'inherit' });
  console.log(`PR ${n}: the owner will be notified`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'check') check();
  else if (cmd === 'ready') ready(args[0], args.slice(1).join(' '));
  else { console.error('Usage: contributions.mjs check | ready <n> <why>'); process.exit(1); }
}
