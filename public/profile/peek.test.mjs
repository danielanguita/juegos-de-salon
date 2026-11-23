// Another player's profile at a glance (peek.js): only public facts, only the achievements they can tell
import assert from 'node:assert/strict';
import { peekFacts, peekBadges, tableOf, PUBLIC_BADGES } from './peek.js';
import { SOLO_TABLES } from '../assets/js/games.js';
import { BADGES } from './badges.js';
import { TEXTS } from './texts.js';

const day = iso => String(Math.round(Date.parse(`${iso}T00:00:00Z`) / 86400000));
const hist = {};
for (let i = 0; i < 12; i++) hist[day(`2026-11-${String(10 + i).padStart(2, '0')}`)] = { s: 1 };
const f = peekFacts({
  jid: 'abcd1234',
  perfil: { n: 'Ana', co: 'CL', at: Date.parse('2026-09-01'), juegos: { ahorcado: { n: 120 }, nope: { n: 5 }, sudoku: { n: 3 } } },
  hist,
  podios: { C1: { name: 'Copa', end: 1, p: { a: { j: 'abcd1234', l: 1, n: 'Ana' } } } },
  general: [{ jid: 'zzzz9999', puesto: 1 }, { jid: 'abcd1234', puesto: 4 }],
  months: [{ period: 's2026-10', top: [{ jid: 'abcd1234', puesto: 2 }] }],
  today: '2026-11-21', now: Date.parse('2026-11-21'),
});
assert.equal(f.n, 'Ana');
assert.equal(f.streak, 12, 'the streak comes from their public Uno al día');
assert.deepEqual(f.byGame.map(g => g.id), ['ahorcado', 'sudoku'], 'an unknown game is left out, most played first');
assert.equal(f.plays, 123);
assert.equal(f.medals.gold, 1);
assert.equal(f.allRounder, 4);
const ids = peekBadges(f).map(b => b.id);
for (const id of ['streak-10', 'plays-100', 'specialist', 'cup-podium', 'cup-champion', 'month-podium', 'all-rounder']) assert.ok(ids.includes(id), id);
assert.ok(ids.every(id => PUBLIC_BADGES.has(id)), 'only what public data can tell');
assert.equal(peekBadges(f)[0].tier, 'gold', 'the best metal first');
for (const id of PUBLIC_BADGES) assert.ok(BADGES.some(b => b.id === id), `${id} is a badge`);
assert.equal(peekFacts({ jid: 'x', perfil: { n: 'B', at: 1 } }).allRounder, null);
// Nothing to hide (D-605): a profile with the old `oculto` still shows everything
assert.deepEqual(peekBadges(peekFacts({ jid: 'abcd1234', perfil: { n: 'Ana', at: 1, oculto: true, juegos: { ahorcado: { n: 120 } } }, hist, today: '2026-11-21', now: Date.parse('2026-11-21') })).map(b => b.id).filter(id => ['streak-10', 'plays-100'].includes(id)).sort(), ['plays-100', 'streak-10']);
// Each most played game shows a place in its all-time table, never a count (the owner, 2026-11-22)
assert.deepEqual(tableOf('reinas'), { t: 'reinas', wins: false });
for (const [id, t] of Object.entries(SOLO_TABLES)) assert.equal(tableOf(id).t, t, `${id} reads ${t}`);
for (const l of ['es', 'en', 'pt']) assert.ok(TEXTS[l].peekGamePlace.includes('{place}') && !/\d/.test(TEXTS[l].peekGamePlace), `${l}: the place, no count`);
for (const l of ['es', 'en', 'pt']) for (const k of ['peekOpen', 'peekLoading', 'peekError', 'peekClose', 'peekPlace', 'peekGames', 'peekGamePlace', 'peekNoGames', 'peekBadges', 'peekBadgesOne', 'peekBadgesNone', 'peekNoBadges', 'publicTitle', 'publicHint', 'seePublic'])
  assert.ok(TEXTS[l][k], `${l}.${k}`);
assert.ok(!/chapita/i.test(JSON.stringify(TEXTS.es)), 'logros, never chapitas');
console.log('✓ profile peek');
for (const l of ['es', 'en', 'pt']) for (const k of ['peekHidden', 'showActivity', 'showActivityHint', 'publicBubbleTitle', 'publicBubbleText', 'publicError'])
  assert.equal(TEXTS[l][k], undefined, `${l}.${k}: no switch, no hidden sheet (D-605)`);
