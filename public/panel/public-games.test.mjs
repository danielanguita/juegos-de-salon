// Lab plays out of every count: node public/panel/public-games.test.mjs
import assert from 'node:assert/strict';
import { publicGameCheck, withoutLabGames, withoutLabCups } from './public-games.js';

const DAY = 864e5, d = 20770;
const check = publicGameCheck({ aletazo: { state: 'all', at: (d + 1) * DAY }, sudoku: { state: 'testers', at: 0 } });
assert.equal(check('tango', d), true, 'a game with no flag is out');
assert.equal(check('pintaminas:hard', d), true, 'its modes and variants too');
assert.equal(check('linea', d), true, "La Copa's games without a page are out");
assert.equal(check('artifacts', d), false, 'a game outside the list is the lab');
assert.equal(check('aletazo', d), false, 'before its launch day');
assert.equal(check('aletazo', d + 1), true, 'from its launch day');
assert.equal(check('sudoku', d + 5), false, 'a flag not at all keeps it in the lab');

const days = { [d]: {
  local: { tango: { solo: { 1: 2 } }, artifacts: { solo: { 1: 9 } } }, fin: { artifacts: { solo: 9 }, tango: { solo: 1 } },
  rooms: { A: { game: 'dudo' }, B: { game: 'memory' } }, live: { x: { game: 'transfer' }, y: { game: 'zip' } }, entradas: { inicio: 4 },
} };
const out = withoutLabGames(days, check);
assert.deepEqual(Object.keys(out[d].local), ['tango']);
assert.deepEqual(Object.keys(out[d].fin), ['tango']);
assert.deepEqual(Object.keys(out[d].rooms), ['A']);
assert.deepEqual(Object.keys(out[d].live), ['y']);
assert.deepEqual(out[d].entradas, { inicio: 4 }, 'what is not about a game stays');
assert.ok(days[d].local.artifacts, 'never changes what it is given');
assert.equal(check('julepe', d), false, 'a game marked labs is the lab, even in ALL_GAMES');
assert.equal(check('conexiones', d), false, "La Bodega is behind the lab's door");
assert.deepEqual(Object.keys(withoutLabCups({ A: { meta: { lab: true } }, B: { meta: {} } })), ['B']);
console.log('panel/public-games: OK');
