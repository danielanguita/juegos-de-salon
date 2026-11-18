// Stop-tests: a Claude Code Stop hook (.claude/settings.json). When a session ends its turn with
// changes on its branch, it runs the unit tests those changes touch: each changed *.test.mjs, and the
// test next to each changed module (foo.mjs → foo.test.mjs). If one fails it blocks the stop (exit 2)
// so the session fixes it before handing the turn back, instead of CI going red after the push.
// It runs each state once (a hash of the changed files' contents), so a turn that changed nothing
// new costs nothing. The whole suite stays `run-tests.mjs`; this is the quick part.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/** The test files a set of changed paths touches. */
export function testsFor(changed, exists = existsSync) {
  const out = new Set();
  for (const f of changed) {
    if (/\.test\.mjs$/.test(f)) out.add(f);
    else if (/\.mjs$/.test(f)) { const t = f.replace(/\.mjs$/, '.test.mjs'); if (exists(t)) out.add(t); }
  }
  return [...out].filter(f => exists(f)).sort();
}

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

if (import.meta.url === `file://${process.argv[1]}`) {
  let input = {};
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  if (input.stop_hook_active) process.exit(0);   // already continuing because of this hook: never loop
  const cwd = input.cwd || process.cwd();
  let changed;
  try {
    const committed = git(cwd, 'diff', '--name-only', 'origin/main...HEAD');
    const working = git(cwd, 'diff', '--name-only', 'HEAD');
    changed = [...new Set(`${committed}\n${working}`.split('\n').filter(Boolean))];
  } catch { process.exit(0); }
  const tests = testsFor(changed, f => existsSync(join(cwd, f)));
  if (!tests.length) process.exit(0);
  const hash = createHash('sha1');
  for (const f of changed) { try { hash.update(f + readFileSync(join(cwd, f))); } catch { hash.update(f); } }
  const stamp = join(tmpdir(), `stop-tests-${createHash('sha1').update(cwd).digest('hex').slice(0, 12)}`);
  const key = hash.digest('hex');
  try { if (readFileSync(stamp, 'utf8') === key) process.exit(0); } catch {}
  const failed = [];
  for (const t of tests) {
    const r = spawnSync(process.execPath, [t], { cwd, encoding: 'utf8', timeout: 60000 });
    if (r.status !== 0) failed.push(`${t}\n${`${r.stdout || ''}${r.stderr || ''}`.split('\n').filter(l => /✖|Error|assert|expected|actual/i.test(l)).slice(0, 6).join('\n')}`);
  }
  if (!failed.length) { try { writeFileSync(stamp, key); } catch {} process.exit(0); }
  console.error(`Unit tests touched by this branch fail (stop-tests.mjs): fix them before handing back.\n${failed.join('\n\n')}`);
  process.exit(2);
}
