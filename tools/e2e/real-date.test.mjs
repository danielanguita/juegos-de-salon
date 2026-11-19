// No end-to-end script depends on the real date (D-589): a script that opens a page whose content
// follows today pins that page's clock, so it passes or fails the same whatever day CI runs. Born
// from 2026-11-19, when the day's Uno al día cover (Generala) turned every PR red at UTC midnight
// (#1624, #1628), and the home page's ✨ New row that comes and goes with a game's first week.
//
// A page follows today when it is the home page (its ✨ New games and their order, the season, the
// Uno al día card), /today/ or a `?today` link, /records/ (the day's, week's and month's tables) or La
// Copa's create screen (the ✨ New style chip). The shared helpers that open the `paths.mjs` catalog
// (`*-common.mjs`, look.mjs) count as opening them all. Pinned means every `launch()` passes `clock`
// (cdp.mjs: E2E_DAY, a day or a time), or the script installs its own clock that replaces `Date`.
// A script meant to follow the real clock is listed below with its reason; an entry that no longer
// applies fails, so the list only shrinks.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = dirname(fileURLToPath(import.meta.url));

/** Scripts that open a page that follows today on the real clock, on purpose. */
export const REAL_CLOCK = {
  'home/cup-today.mjs': 'builds cups that started yesterday and six days ago in node, against the real clock, to see the live countdown chips',
  'feedback-prod.mjs': "writes in node the day the feedback prompt was seen and sent (real today, 3 and 15 days ago) for the page to compare with its own clock",
  'offline.mjs': "the service worker's clock is the real one (a page's clock cannot reach a worker) and the page compares its progress time with it",
  'versioning.mjs': 'opens a room in the production Firebase, whose server clock the page compares with its own; run by hand',
  'lang-from-url.mjs': 'opens /liars-dice/?room= in the production Firebase, whose server clock the page compares with its own; run by hand',
  'cup/tournament.mjs': 'opens the home page only to clear storage; the cups it plays move their own clock (adelantar, anchored with medianoche, clock-jumps.test.mjs)',
  'fourth-king/game.mjs': 'opens the home page only to clear storage, then plays the game, which reads no date',
  'bulls-and-cows/local.mjs': 'opens the home page only to clear storage, then plays the game, which reads no date',
  'generala/local.mjs': 'opens the home page only to clear storage, then plays the game, which reads no date',
  'julep/local.mjs': 'opens the home page only to clear storage, then plays the game, which reads no date',
  'liars-dice/local.mjs': 'opens the home page only to clear storage, then plays the game, which reads no date',
  'liars-dice/shake-clock.mjs': 'opens the home page only to clear storage; it moves the game\'s own clock to test the shake timer',
};

const DATE_ROUTES = [
  [/\$\{SITE\}\/(\?[^`'"\s]*)?[`'"]/, 'the home page'],
  [/\/today\/|[?&]today\b/, '/today/ or a ?today link'],
  [/\brecords\//, '/records/'],
  [/\bcup\/\?test(?![^`'"\s]*demo=)/, "La Copa's create screen"],
];
const HELPER = f => /-common\.mjs$/.test(f) || f === 'look.mjs';
const OWN_CLOCK = /addScriptToEvaluateOnNewDocument[\s\S]{0,600}?\b(window|globalThis)\.Date\s*=|\bclockAt\(|\bCLOCK\(|\bFREEZE\b/;

const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) { if (n !== 'node_modules') walk(p); }
    else if (n.endsWith('.mjs') && !n.endsWith('.test.mjs')) files.push(relative(root, p));
  }
})(root);

/** What a script opens that follows today, or null; and whether it pins every browser's clock. */
export function audit(f, src) {
  const launches = [...src.matchAll(/\blaunch\(\{([\s\S]*?)\}\)/g)].map(m => m[1]);
  if (!launches.length) return null;
  const opens = HELPER(f) ? 'the paths.mjs catalog' : DATE_ROUTES.find(([re]) => re.test(src))?.[1];
  if (!opens) return null;
  return { opens, pinned: OWN_CLOCK.test(src) || launches.every(a => /\bclock:/.test(a)) };
}

/**
 * A pinned script whose check compares the page's times with node's clock: node runs on the real date,
 * the page on E2E_DAY, so the check passes only while the two are close (install-prompt.mjs's snooze, red
 * from 2026-11-19 13:00 UTC on, #1644). The lines with a check (`ok(`, `assert`) that read Date.now() or
 * new Date() outside a page string; the page's own clock is `await ev(\`Date.now()\`)`.
 */
export function nodeClock(src) {
  return src.split('\n').map((l, i) => [l, i + 1])
    .filter(([l]) => /\b(ok|assert(\.\w+)?)\(/.test(l) && /\bDate\.now\(\)|\bnew Date\(/.test(l.replace(/`(?:\\.|[^`])*`/g, '``')))
    .map(([, n]) => n);
}

const bad = [], stale = [];
for (const f of files) {
  const src = readFileSync(join(root, f), 'utf8');
  const a = audit(f, src);
  if (a?.pinned) for (const n of nodeClock(src)) bad.push(`${f}:${n}: a check compares with node's real clock while the page runs on E2E_DAY: read the page's, await ev(\`Date.now()\`)`);
  if (a && !a.pinned && !REAL_CLOCK[f]) bad.push(`${f}: opens ${a.opens} on the real clock: launch({ …, clock: true }) (cdp.mjs E2E_DAY), or list it in REAL_CLOCK with its reason`);
  if (REAL_CLOCK[f] && (!a || a.pinned)) stale.push(`${f}: listed in REAL_CLOCK but ${a ? 'pinned now' : 'opens no page that follows today'}: drop the entry`);
}
for (const f of Object.keys(REAL_CLOCK)) if (!files.includes(f)) stale.push(`${f}: listed in REAL_CLOCK but gone`);
assert.deepEqual(bad, [], `a script depends on the real date (D-589):\n${bad.join('\n')}`);
assert.deepEqual(stale, [], stale.join('\n'));

// The detector itself, on samples
assert.equal(audit('x.mjs', "await launch({ out }); await b.go(`${SITE}/?test`)").pinned, false);
assert.equal(audit('x.mjs', "await launch({ out, clock: true }); await b.go(`${SITE}/today/`)").pinned, true);
assert.equal(audit('x.mjs', "await launch({ out }); await b.go(`${SITE}/hangman/?test`)"), null);
assert.equal(audit('x.mjs', "await launch({ out }); await b.go(`${SITE}/cup/?test&demo=final`)"), null);
assert.equal(audit('x-common.mjs', "await launch({ out })").opens, 'the paths.mjs catalog');
assert.deepEqual(nodeClock("ok(x.until > Date.now() + 1, 'snoozed')"), [1]);
assert.deepEqual(nodeClock("ok(x.until > await ev(`Date.now()`) + 1, 'snoozed')"), []);
assert.deepEqual(nodeClock("const t0 = Date.now();"), []);
console.log(`✓ no e2e script depends on the real date: ${files.length} scripts read, ${Object.keys(REAL_CLOCK).length} on the real clock with their reason`);
