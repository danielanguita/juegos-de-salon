// Scope guard (D-597): a PreToolUse hook on Edit|Write|NotebookEdit that an agent declares in its own
// frontmatter (`node tools/agents/scope-guard.mjs <agent>`), so it runs only while that agent works.
// It turns "you do not touch app code" from a line in the prompt into a rule: a file outside the
// agent's scope is blocked with exit 2. Paths are relative to the worktree the file is in; anything
// outside the repo (memory, scratchpad) passes. Bash can still write files: the guard covers the
// edits an agent reasons about, the tests and the lanes cover the rest.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';

const DOCS = ['docs/', 'changelog/'];

/** What each scoped agent may edit: a prefix ending in "/" is a folder, anything else one file. */
export const SCOPES = {
  // Documentation, plus the messages the app introduces itself with (D-271)
  documentation: [...DOCS, 'README.md', 'CLAUDE.md', 'tools/e2e/README.md', 'tools/jobs/README.md',
    'public/assets/js/compartir.js', 'public/assets/js/i18n.js', 'tools/release/og.mjs'],
  // Proposes ideas and decisions; builds nothing without a Yes (D-360)
  ideas: DOCS,
  // Proposes one action and writes its verdict; never ships (learning piece 7)
  retention: DOCS,
};

export function allowed(rel, scope) {
  return scope.some(p => (p.endsWith('/') ? rel.startsWith(p) : rel === p));
}

/** The worktree that holds `file` (it may not exist yet), or null outside any repo. */
function worktreeOf(file) {
  let dir = dirname(resolve(file));
  while (!existsSync(dir) && dir !== dirname(dir)) dir = dirname(dir);
  try { return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
}

/** null when the edit may go ahead, or why not. */
export function verdict(agent, file, root) {
  const scope = SCOPES[agent];
  if (!scope || !file || !root) return null;
  const f = resolve(file);
  if (!f.startsWith(root + sep)) return null;
  const rel = relative(root, f).split(sep).join('/');
  return allowed(rel, scope) ? null
    : `Edit stopped (scope-guard.mjs, D-597): the ${agent} agent may edit only ${scope.join(', ')}; ${rel} is outside. If it needs changing, say so in your PR or report for the owner or the session that owns it.`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const agent = process.argv[2];
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const file = input?.tool_input?.file_path || input?.tool_input?.notebook_path;
  const why = file ? verdict(agent, file, worktreeOf(file)) : null;
  if (!why) process.exit(0);
  console.error(why);
  process.exit(2);
}
