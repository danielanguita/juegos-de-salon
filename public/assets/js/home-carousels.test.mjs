// The home page's carousels (lab flag home-carousels): which rows there are and what each holds.
import assert from 'node:assert/strict';
import { shelves, maxMinutes, rankingOf, TEXTS, QUICK_MINUTES } from './home-carousels.js';
import { PORTADA, TIPOS, SOLO_TABLES } from './games.js';

const games = PORTADA.filter(g => g.id !== 'letras');
const open = games.filter(g => g.available && !g.torneo);
const rows = shelves(games, { favs: [] });
const ids = rows.map(r => r.id);

// Every game the home page offers is in at least one row (C-21): none is lost with the list gone
const inRows = new Set(rows.flatMap(r => r.games.map(g => g.id)));
for (const g of open) assert.ok(inRows.has(g.id), `${g.id} is in no carousel: give it a type in games.js`);
// La Copa keeps its own card above the rows; no row is empty; a type with no game has no row
assert.ok(!inRows.has('copa'), 'La Copa is not a tile');
for (const r of rows) assert.ok(r.games.length > 0, `${r.id} is empty`);
for (const id of ids.filter(id => TIPOS[id])) assert.ok(open.some(g => (g.tipos || []).includes(id)));
// The order: the shortcuts first, then the types in their own order
assert.deepEqual(ids.filter(id => !TIPOS[id]), ['popular', 'new', 'friends', 'quick'].filter(id => ids.includes(id)));
assert.deepEqual(ids.filter(id => TIPOS[id]), Object.keys(TIPOS).filter(id => ids.includes(id)));
// Favourites come first, and only with one marked
assert.ok(!ids.includes('favorites'));
const withFav = shelves(games, { favs: [open[3].id] });
assert.equal(withFav[0].id, 'favorites');
assert.deepEqual(withFav[0].games.map(g => g.id), [open[3].id]);
// With friends: more than one can play. Quick: its longest play fits the limit
const row = id => rows.find(r => r.id === id)?.games || [];
assert.ok(row('friends').length && row('friends').every(g => /\d\D+\d/.test(g.players)), 'with friends: a range of players');
assert.ok(row('quick').every(g => maxMinutes(g) <= QUICK_MINUTES));
assert.equal(maxMinutes({ duration: '5–30' }), 30);
assert.equal(maxMinutes({ duration: '7' }), 7);
assert.equal(maxMinutes({ duration: '7', durationUnit: { es: 'días' } }), Infinity, 'days are never quick');
// The ranking a sheet shows: wins for a game played in a room, else its solo table (as /records/)
assert.deepEqual(rankingOf({ id: 'dudo', jugadas: true }), { table: 'dudo_victorias', wins: true });
assert.deepEqual(rankingOf({ id: 'reinas' }), { table: 'reinas', wins: false });
assert.deepEqual(rankingOf({ id: 'sapiondo' }), { table: SOLO_TABLES.sapiondo, wins: false });
// The same texts in every language (C-3)
for (const l of ['en', 'pt']) assert.deepEqual(Object.keys(TEXTS[l]), Object.keys(TEXTS.es), `${l}: the same keys as es`);
console.log(`✓ home-carousels: ${rows.length} rows, ${inRows.size} games, every one in a row`);
