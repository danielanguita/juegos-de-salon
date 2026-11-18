// Worktree guard: a Claude Code PreToolUse hook (.claude/settings.json) on Edit|Write|NotebookEdit.
// Stops a session from editing files in the main folder of the repo, where parallel sessions
// collide (D-135: own worktree, topic branch). Files in .claude/worktrees/<name>/, and anything
// outside the repo (memory, scratchpad, settings), pass. Exit 2 blocks with what to do instead.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';

/** The repo's main folder, from git's common dir (the same for every worktree). */
export function mainRoot(cwd) {
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd, encoding: 'utf8' }).trim();
  return dirname(common);
}

export function blocked(file, root) {
  if (!file || !root) return false;
  const f = resolve(file);
  const inside = f === root || f.startsWith(root + sep);
  return inside && !f.startsWith(resolve(root, '.claude/worktrees') + sep);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const file = input?.tool_input?.file_path || input?.tool_input?.notebook_path;
  let root;
  try { root = mainRoot(input.cwd || process.cwd()); } catch { process.exit(0); }
  if (!blocked(file, root)) process.exit(0);
  console.error(`Edit stopped (worktree-guard.mjs, D-135): ${file} is in the repo's main folder, which parallel sessions share. Work in your own worktree on a topic branch (EnterWorktree, or git worktree add .claude/worktrees/<name> -b <branch> origin/main) and edit the file there. docs/SESSIONS.md.`);
  process.exit(2);
}
