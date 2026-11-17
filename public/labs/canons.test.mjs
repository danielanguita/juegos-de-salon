// node public/labs/canons.test.mjs — a game enters the lab with its canons (D-579): the same cover,
// result screen and game canons a published game keeps, checked here before it can merge, ours or a
// contributor's. A lab game (labs/<folder>/ with an index.html and a game.js) needs:
//   manifest  its game.json, so the conformance suite runs over it (C-2, C-3, C-6, C-7, C-19's exits:
//             public/assets/js/conformance.test.mjs and, in the browser, tools/e2e/conformance.mjs)
//   cover     its landing in tools/e2e/paths.mjs with `intro`, so landing-fold.mjs measures its cover at
//             320 and 375 px: the main action above the fold, even margins (C-17)
//   exits     its result exits from salidasFin in fin.js (C-19)
//   rankings  its result in the rankings: finDePartida, bloqueTabla or avisoPartida from ranking.js (C-19)
// A canonException in its game.json whose reason names the subject excuses one, as in conformance.
// The lab games that came before this rule are debt in docs/labs-canon-debt.json, a ratchet: an entry
// lists exactly what its game still lacks, it only shrinks, and no new game may join it.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PATHS } from '../../tools/e2e/paths.mjs';
import { excuses } from '../../tools/generators/conformance.mjs';

const LABS = fileURLToPath(new URL('.', import.meta.url));
const DEBT_FILE = new URL('../../docs/labs-canon-debt.json', import.meta.url);
// The games in the lab when the rule came in (2026-11-17): only these may carry debt
const FROZEN = ['artifacts', 'blackjack', 'chameleon', 'code', 'dominorama', 'exploding-numbers', 'flap', 'fourth-king',
  'julep', 'memory', 'stack', 'sudoku', 'transfer', 'wobbles', 'wobbles-3d'];

const read = (...p) => existsSync(join(LABS, ...p)) ? readFileSync(join(LABS, ...p), 'utf8') : '';
const games = readdirSync(LABS, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(LABS, d.name, 'index.html')) && existsSync(join(LABS, d.name, 'game.js')))
  .map(d => d.name).sort();

/** What a lab game lacks of its canons. */
export function missing(folder) {
  const m = read(folder, 'game.json') ? JSON.parse(read(folder, 'game.json')) : null;
  const game = read(folder, 'game.js');
  const ok = (canon, subject, pass) => pass || (m && excuses(m, canon, subject));
  const out = [];
  if (!m) out.push('manifest');
  if (!ok('C-17', 'cover', [`labs/${folder}`, folder, m?.id].some(k => k && PATHS[k]?.intro))) out.push('cover');
  if (!ok('C-19', 'fin.js', /\bsalidasFin\(/.test(game))) out.push('exits');
  if (!ok('C-19', 'rankings', /\b(finDePartida|bloqueTabla|avisoPartida)\(/.test(game))) out.push('rankings');
  return out;
}

const debt = JSON.parse(readFileSync(DEBT_FILE, 'utf8')).games;
let bad = 0;
for (const g of games) {
  const lacks = missing(g);
  const owed = debt[g]?.missing || [];
  const fail = lacks.filter(x => !owed.includes(x));
  if (fail.length) { bad++; console.error(`✗ labs/${g} lacks ${fail.join(', ')}: a lab game comes in with its canons (D-579, docs/ADD-GAME.md)`); }
  const paid = owed.filter(x => !lacks.includes(x));
  assert.equal(paid.length, 0, `docs/labs-canon-debt.json: labs/${g} has ${paid.join(', ')} now, remove it (the debt only shrinks)`);
}
assert.equal(bad, 0, `${bad} lab game(s) lack their canons`);
for (const [g, d] of Object.entries(debt)) {
  assert.ok(FROZEN.includes(g), `docs/labs-canon-debt.json: ${g} is new debt; a new lab game comes in with its canons (D-579)`);
  assert.ok(games.includes(g), `docs/labs-canon-debt.json: labs/${g} is not a lab game any more, remove it (stale)`);
  assert.ok(Array.isArray(d.missing) && d.missing.length, `docs/labs-canon-debt.json: ${g} owes nothing, remove it`);
}

// The check catches what it claims to: a folder with nothing has no manifest, cover, exits or rankings
assert.deepEqual(missing('no-such-game'), ['manifest', 'cover', 'exits', 'rankings']);

console.log(`lab canons: ${games.length} lab game(s), ${Object.keys(debt).length} with debt`);
