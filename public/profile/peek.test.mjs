// Another player's profile at a glance (peek.js): only public facts, only the achievements they can tell
import assert from 'node:assert/strict';
import { peekFacts, peekBadges, PUBLIC_BADGES, ACTIVITY_BADGES } from './peek.js';
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
// Hidden activity (the default): the achievements that count how much they play stay out
assert.equal(f.open, true);
const shy = { ...f, open: false };
const shyIds = peekBadges(shy).map(b => b.id);
assert.ok(!shyIds.some(id => ACTIVITY_BADGES.has(id)), 'no streak, plays or days achievements when the activity is hidden');
for (const id of ['cup-champion', 'month-podium', 'all-rounder']) assert.ok(shyIds.includes(id), `${id} still shows`);
assert.equal(peekFacts({ jid: 'x', perfil: { n: 'B', at: 1 } }).open, true, 'shown unless the player hid it (D-604)');
assert.equal(peekFacts({ jid: 'x', perfil: { n: 'B', at: 1, oculto: true } }).open, false, 'hidden once the player hides it');
for (const id of ACTIVITY_BADGES) assert.ok(PUBLIC_BADGES.has(id), id);
for (const l of ['es', 'en', 'pt']) for (const k of ['peekOpen', 'peekLoading', 'peekError', 'peekClose', 'peekPlace', 'peekGames', 'peekNoGames', 'peekBadges', 'peekBadgesOne', 'peekBadgesNone', 'peekNoBadges', 'peekHidden', 'publicBubbleTitle', 'publicBubbleText', 'publicTitle', 'publicHint', 'showActivity', 'showActivityHint', 'seePublic', 'publicError'])
  assert.ok(TEXTS[l][k], `${l}.${k}`);
assert.ok(!/chapita/i.test(JSON.stringify(TEXTS.es)), 'logros, never chapitas');
console.log('✓ profile peek');
