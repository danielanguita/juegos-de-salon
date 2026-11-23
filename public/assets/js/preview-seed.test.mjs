// The preview's made-up data (preview-seed.js): only on a PR preview's host, once, and what it writes
// passes for the test store's own data (rankings rows and duels the duels' code can read).
import assert from 'node:assert/strict';
import { isPreview, seedPreview, testData } from './preview-seed.js';
import { estado } from './duels.js';

const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };
const preview = { hostname: 'ellokojavi.github.io', pathname: '/juegos-de-salon-previews/una-rama/duels/' };
assert.equal(isPreview(preview), true);
assert.equal(isPreview({ hostname: 'localhost', pathname: '/duels/' }), false, 'never on localhost: the e2e scripts expect an empty store');
assert.equal(isPreview({ hostname: 'juegosdesalon.cl', pathname: '/duels/' }), false, 'never on the real site');

const s = mem();
assert.equal(seedPreview({ storage: s, loc: { hostname: 'localhost', pathname: '/' } }), false);
assert.equal(s.m.size, 0);
assert.equal(seedPreview({ storage: s, loc: preview, now: 1_800_000_000_000 }), true);
assert.equal(seedPreview({ storage: s, loc: preview }), false, 'once per browser');
const db = JSON.parse(s.getItem('juegos-de-salon:prueba:records-db'));
assert.ok(Object.keys(db.jugadores).length >= 6, 'made-up players');
assert.ok(Object.keys(db.duelosRecientes).length >= 4, 'and recent duels');

const t = 1_800_000_000_000, d = testData(t);
const fin = Object.entries(d.duelos).map(([id, x]) => estado({ id, ...x }, x.a, t));
assert.ok(fin.some(e => e.termino) && fin.some(e => !e.termino), 'some duels finished, some in play');
console.log('preview seed: ok');
