// PR-created reminder: a Claude Code PostToolUse hook (.claude/settings.json) on Bash. Right after
// `gh pr create` succeeds it adds to the session's context the steps sessions forgot to take
// (CLAUDE.md "Before proposing a merge", D-519, D-522, D-575): the lane, its tick when the owner
// asked for the work, auto-merge, watching the PR. It only reminds: it never blocks.
import { readFileSync } from 'node:fs';

export const isPrCreate = command => /(^|[;&|\s(])gh\s+pr\s+create(\s|$)/.test(command || '');

/** The PR number from gh's output (its URL), or null. */
export function prNumber(output) {
  const m = String(output || '').match(/\/pull\/(\d+)/);
  return m ? Number(m[1]) : null;
}

export function reminder(n) {
  const pr = n ? `#${n}` : 'the PR';
  const id = n || '<n>';
  return [
    `PR ${pr} is open. Before going on (CLAUDE.md, "Before proposing a merge"):`,
    `1. node tools/agents/lanes.mjs check — and run the agents its lane requires; if the PR changes a game, also the player agent on its preview.`,
    `2. If it is 🔴 and the owner asked for this work in this dialogue: node tools/agents/lanes.mjs tick ${id} (D-540, D-575).`,
    `3. node tools/firebase/in-progress.mjs, then gh pr merge ${id} --auto --merge unless the lane is 🔴 (D-216).`,
    `4. Watch it: subscribe_pr_activity in a cloud session, else node tools/agents/wait-pr.mjs ${id} in the background (D-400, D-522).`,
  ].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  if (!isPrCreate(input?.tool_input?.command)) process.exit(0);
  const r = input.tool_response || {};
  const out = typeof r === 'string' ? r : `${r.stdout || ''}${r.output || ''}`;
  const n = prNumber(out);
  if (!n) process.exit(0);
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: reminder(n) } }));
}
