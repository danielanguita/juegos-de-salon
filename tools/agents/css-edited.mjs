// CSS-edited check: a Claude Code PostToolUse hook (.claude/settings.json) on Edit|Write. Right after a
// stylesheet is edited it runs the design lint on that file (D-533) and, if it has hits, adds them to
// the session's context, so a value off the tokens is fixed while the file is open instead of at push
// time (push-guard runs the gate then). It never blocks.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

export const isCss = file => /\.css$/.test(file || '');

/** The lint's hit lines for one file, or [] when clean or when the lint cannot run. */
export function hits(file, cwd, run = (args) => spawnSync('node', args, { cwd, encoding: 'utf8' })) {
  const r = run(['tools/agents/design-lint.mjs', relative(cwd, file)]);
  const out = `${r.stdout || ''}`;
  const n = Number(/(\d+) hits? not allowlisted/.exec(out)?.[1] || 0);
  if (r.error || !n) return [];
  return out.split('\n').filter(l => l.trim() && !/not allowlisted/.test(l)).slice(0, 15);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  const file = input?.tool_input?.file_path;
  if (!isCss(file)) process.exit(0);
  const found = hits(file, input.cwd || process.cwd());
  if (!found.length) process.exit(0);
  const context = `The design lint (D-533, the css-change skill) found values off the tokens in ${file}; fix them now with the token, or allowlist with a reason:\n${found.join('\n')}`;
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context } }));
}
