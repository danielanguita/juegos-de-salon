// Run: node tools/e2e/only.test.mjs
// A script that opens every game's page and takes `--only <ids>` (landing-fold.mjs) runs, on a PR whose
// changes are each a game's own, only for the games they reach; whole when a change is shared (D-588).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { closures, select, onlyIds, parseJob, pageOfRoute } from './affected.mjs';
import { noBrowser } from './changes.mjs';
import { chosenJobs, narrowedDurations, landingRoutes, NOT_LANDINGS, PARTS } from './ci.mjs';

// The pieces, on a small site
{
  const files = {
    'index.html': '<script type="module" src="assets/js/home.js"></script>',
    'hangman/index.html': '<link href="../assets/css/base.css"><script type="module" src="game.js"></script>',
    'hangman/game.js': '',
    'generala/index.html': '<link href="../assets/css/base.css"><link href="style.css">',
    'generala/style.css': '',
    'labs/index.html': '<link href="../assets/css/base.css">',
    'assets/css/base.css': '', 'assets/js/home.js': '',
  };
  const graph = closures(files);
  const shared = f => noBrowser([f]);
  const ids = { ahorcado: ['hangman'], generala: ['generala'] };
  const scripts = [
    { name: 'landing-fold.mjs', source: "for (const g of games) go(`${SITE}/${g}`); new Set(['labs'])", pages: ['hangman', 'generala'] },
    { name: 'hangman/local.mjs', source: 'go(`${SITE}/hangman/`)' },
  ];
  const pick = changes => select({ changes, graph, scripts, shared, files });
  const only = changes => { const c = pick(changes); return c.scripts.includes('landing-fold.mjs') ? onlyIds('landing-fold.mjs', c, ids) ?? 'whole' : 'none'; };

  assert.deepEqual(only(['public/generala/style.css']), ['generala'], "a game's own file: that game only");
  assert.deepEqual(only(['public/generala/style.css', 'public/hangman/game.js']), 'whole', 'every game reached: whole');
  assert.equal(only(['public/assets/css/base.css']), 'whole', 'a shared file: whole');
  assert.equal(only(['public/labs/index.html']), 'none', 'a page that is no landing (the lab index, which the script names only to leave out): not at all');
  assert.equal(only(['tools/e2e/landing-fold.mjs']), 'whole', 'the script itself: whole');
  // A shared file whose change reaches one game only by name (D-516) is still a shared file reaching one game's pages
  const own = { ...ids, copa: ['cup'] };
  assert.equal(onlyIds('landing-fold.mjs', { changedScripts: new Set(), imports: new Set(), pages: new Set(['hangman', 'cup']), reached: { 'cup/style.css': ['hangman', 'cup'] } }, own), null,
    'one file reaching two games: whole, even if other games are not reached');
  assert.equal(onlyIds('landing-fold.mjs', { changedScripts: new Set(), imports: new Set(['landing-fold.mjs']), pages: new Set(['hangman']), reached: { 'hangman/game.js': ['hangman'] } }, own), null,
    'a module the script imports itself: whole');
  assert.equal(onlyIds('landing-fold.mjs', null, own), null, 'the graph cannot narrow: whole');
}

assert.deepEqual(parseJob('landing-fold.mjs:320@croc,generala'), { job: 'landing-fold.mjs:320', only: ['croc', 'generala'] });
assert.deepEqual(parseJob('landing-fold.mjs:320'), { job: 'landing-fold.mjs:320', only: null });
assert.equal(pageOfRoute('cup/suelto/?timeline-flash&today', ['cup', 'cup/suelto', 'hangman']), 'cup/suelto');
assert.equal(pageOfRoute('labs/croc/', ['labs', 'labs/croc']), 'labs/croc');
console.log('only: the pieces, green');

// On the real site and CI's real jobs
{
  const lf = list => list.filter(j => j.startsWith('landing-fold.mjs'));
  const whole = PARTS['landing-fold.mjs'].map(p => `landing-fold.mjs:${p}`);
  assert.deepEqual(lf(chosenJobs(['public/generala/style.css'])), whole.map(j => `${j}@generala`), "Generala's own style: landing-fold for Generala only");
  assert.deepEqual(lf(chosenJobs(['public/labs/cryptic/style.css'])), whole.map(j => `${j}@cryptic`), "a lab game's own style (#1624): that game only");
  assert.deepEqual(lf(chosenJobs(['public/labs/index.html'])), [], 'the lab index is no landing (#1624 ran the whole script for it)');
  for (const f of ['public/assets/css/base.css', 'public/cup/style.css', 'public/cup/game.js', 'public/assets/js/uno-al-dia-ui.js', 'tools/e2e/paths.mjs', 'tools/e2e/landing-fold.mjs'])
    assert.deepEqual(lf(chosenJobs([f])), whole, `${f} is shared: landing-fold whole`);
  assert.deepEqual(lf(chosenJobs(null)), whole, 'main, with no list of changes: whole');
  // A narrowed job is estimated as its share of the whole one, never more
  const dur = { 'landing-fold.mjs:320': 240 };
  const est = narrowedDurations(['landing-fold.mjs:320@generala'], dur)['landing-fold.mjs:320@generala'];
  assert.ok(est >= 15 && est < 240, `estimate ${est}`);
}
console.log('only: the real site, green');

// landing-fold.mjs's landings come from the same sources ONLY reads: PATHS' intro without NOT_LANDINGS,
// Uno al día's games and La Copa's day covers. If it measures something new, ONLY must learn it first.
{
  const src = readFileSync(new URL('landing-fold.mjs', import.meta.url), 'utf8');
  const own = src.match(/const NOT_LANDINGS = new Set\(\[([^\]]*)\]\)/);
  assert.ok(own, 'landing-fold.mjs keeps its NOT_LANDINGS set');
  assert.deepEqual(own[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean).sort(), [...NOT_LANDINGS].sort(),
    "ci.mjs's NOT_LANDINGS must be landing-fold.mjs's");
  assert.equal((src.match(/only\.includes\(/g) || []).length, 3, 'landing-fold.mjs filters three sources by --only (games, Uno al día, La Copa): a new one must be added to landingRoutes() in ci.mjs');
  const routes = landingRoutes();
  assert.ok(routes.generala && routes.copa && routes.linea && !routes.panel && !routes.labs);
}
console.log('only: landing-fold.mjs and ci.mjs agree, green');
