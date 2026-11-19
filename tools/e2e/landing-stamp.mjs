/**
 * The landing-fold stamp: a push that changes a game's cover waits until `landing-fold.mjs --only
 * <game>` passed on that content in this worktree (push-guard.mjs). Born from #1624 and #1629: covers
 * pushed unmeasured came back red from CI five times each, ~8 min a round, where the local run takes
 * ~15 s a width.
 *
 * A game's cover is what its landing draws: the files directly in its folder (`public/<route>`) that
 * the page loads (.html, .css, .js except the pure engine and the tests), and a change to its visual
 * reference (`tools/e2e/visual/ref/<folder>-intro.png`) says a cover change is intended. The stamp
 * keeps, per game, a hash of those page files and the widths landing-fold passed on them; it lives
 * in the worktree's own git folder (`git rev-parse --git-path landing-fold-stamp.json`), so it is
 * never committed and each worktree has its own.
 *
 *   node tools/e2e/landing-stamp.mjs --check   # exit 1 naming the command, when a touched cover is unmeasured
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** The widths a cover must pass (landing-fold.mjs SIZES; kept here so the guard stays fast). */
export const WIDTHS = [320, 375];
// Not a game's landing (as in landing-fold.mjs)
const NOT_LANDINGS = new Set(['panel', 'labs']);

/** Whether a file directly in a game's folder is part of what its cover draws. */
export const isCoverFile = name => /\.(html|css|js)$/.test(name) && name !== 'engine.js' && !/\.test\./.test(name);

/** The landings landing-fold.mjs measures, as { id, route }: every PATHS key with an intro. */
export async function landings(root = ROOT) {
  const { PATHS, routeOf } = await import(join(root, 'tools/e2e/paths.mjs'));
  return Object.keys(PATHS).filter(g => PATHS[g].intro && !NOT_LANDINGS.has(g))
    .map(id => ({ id, route: routeOf(id) })).filter(l => l.route);
}

/** The cover files of a route, relative to the repo, sorted. */
export function coverFiles(route, root = ROOT) {
  const dir = join(root, 'public', route);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter(e => e.isFile() && isCoverFile(e.name))
    .map(e => join('public', route, e.name)).sort();
}

/** The hash of a route's cover files as they are on disk. */
export function coverHash(route, root = ROOT) {
  const h = createHash('sha256');
  for (const f of coverFiles(route, root)) h.update(`${f}\0`).update(readFileSync(join(root, f))).update('\0');
  return h.digest('hex').slice(0, 16);
}

/** The landings whose cover a list of changed files reaches. */
export function touched(files, list) {
  return list.filter(({ route }) => {
    const folder = `public/${route}`, part = route.replace(/\/$/, '').split('/').pop();
    return files.some(f => (f.startsWith(folder) && !f.slice(folder.length).includes('/') && isCoverFile(f.slice(folder.length)))
      || f === `tools/e2e/visual/ref/${part}-intro.png`);
  });
}

export function stampPath(root = ROOT) {
  return execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-path', 'landing-fold-stamp.json'], { cwd: root, encoding: 'utf8' }).trim();
}

export function readStamp(root = ROOT) {
  try { return JSON.parse(readFileSync(stampPath(root), 'utf8')); } catch { return {}; }
}

/** Records that `id` passed at `width` on its cover as it is now. A new hash drops the widths of the old one. */
export function record(passed, root = ROOT) {
  const stamp = readStamp(root);
  for (const { id, route, width } of passed) {
    const hash = coverHash(route, root);
    const prev = stamp[id]?.hash === hash ? stamp[id].widths : [];
    stamp[id] = { hash, widths: [...new Set([...prev, width])].sort((a, b) => a - b), at: new Date().toISOString() };
  }
  writeFileSync(stampPath(root), JSON.stringify(stamp, null, 2) + '\n');
}

/** The touched landings not measured on their current content at every width. */
export function unmeasured(files, list, stamp, hash = r => coverHash(r)) {
  return touched(files, list).filter(({ id, route }) => {
    const s = stamp[id];
    return !s || s.hash !== hash(route) || !WIDTHS.every(w => s.widths?.includes(w));
  });
}

if (import.meta.url === `file://${process.argv[1]}` && process.argv.includes('--check')) {
  let files = [];
  try {
    files = execFileSync('git', ['diff', '--name-only', 'origin/main...HEAD'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch { process.exit(0); } // git cannot answer: let it through
  const list = await landings();
  const missing = unmeasured(files, list, readStamp());
  if (!missing.length) process.exit(0);
  const ids = missing.map(l => l.id).join(',');
  console.log(`a cover changed without its landing-fold run on this content (${missing.map(l => l.route).join(', ')}): serve this worktree (python3 -m http.server 8765 -d public; another port with SITE=http://localhost:<port>) and run node tools/e2e/landing-fold.mjs --only ${ids} (~15 s a width)`);
  process.exit(1);
}
