// The comment notification (D-564): who gets it, when, grouped, and only once per comment.
import assert from 'node:assert/strict';
import { talkNotifications, wantsTalk, GAP, WINDOW } from './talk.mjs';
import { sentToday } from './schedule.mjs';

const H = 3600e3;
// 15:00 in Santiago (UTC-3) on a cup day
const now = Date.UTC(2026, 10, 16, 18, 0);
const cup = {
  meta: { name: 'Los Primos', days: 7, end: now + 3 * 24 * H, win: { 1: { a: now - 5 * H, b: now + 20 * H } } },
  players: { ana: { name: 'Ana' }, bea: { name: 'Bea' }, car: { name: 'Car' } },
};
const subs = { s1: { tz: 'America/Santiago', lang: 'es' } };
const wants = { ana: { s1: { dia: true, plazo: true, charla: true, at: now - 10 * H } } };
const talk = { 1: { ana: { bea: { c: 'Bien', at: now - 20 * 60e3 }, ana: { c: 'mío', at: now - 10 * 60e3 } } } };
const run = (o = {}) => talkNotifications({ code: 'ABCDE', cup, talk, hidden: {}, wants, subs, sent: {}, now, flagAll: false, ...o });

let r = run();
assert.equal(r.length, 1);
assert.equal(r[0].notification.body, '💬 Bea comentó tu resultado.', 'who, never what');
assert.ok(!r[0].notification.body.includes('Bien'));
assert.deepEqual(r[0].keys, ['charla:1:bea'], 'not their own comment');
assert.match(r[0].notification.url, /cup\/\?ABCDE&notif=comment$/, 'opens the cup');

assert.equal(run({ sent: { s1: { 'charla:1:bea': now - H } } }).length, 0, 'each comment once, edits included');
assert.equal(run({ hidden: { 1: { ana: { bea: true } } } }).length, 0, 'not a hidden one');
assert.equal(run({ now: now + WINDOW }).length, 0, 'not an old one');
assert.equal(run({ now: Date.UTC(2026, 10, 17, 3, 0) }).length, 0, 'never at night for the recipient');
assert.equal(run({ sent: { s1: { 'charla:1:xxx': now - GAP + 60e3 } } }).length, 0, 'at most one every GAP');
assert.equal(run({ sent: { s1: { 'charla:1:xxx': now - GAP } } }).length, 1, 'after GAP, the next one');

// Grouped
const many = { 1: { ana: { bea: { c: 'a', at: now - 3 * 60e3 }, car: { c: 'b', at: now - 2 * 60e3 } } } };
assert.equal(run({ talk: many })[0].notification.body, '💬 2 comentarios nuevos en tu fila, de Bea y Car.');
assert.deepEqual(run({ talk: many })[0].keys, ['charla:1:bea', 'charla:1:car']);

// The flag: before 'all', only who turned it on; after, everyone but who turned it off
assert.equal(wantsTalk({}, false), false);
assert.equal(wantsTalk({ charla: true }, false), true);
assert.equal(wantsTalk({}, true), true);
assert.equal(wantsTalk({ charla: false }, true), false);
assert.equal(run({ wants: { ana: { s1: { at: 0 } } } }).length, 0, 'in the lab only with charla on');
assert.equal(run({ wants: { ana: { s1: { at: 0 } } }, flagAll: true }).length, 1, 'for everyone once launched');
assert.equal(run({ wants: { ana: { s1: { at: now - 5 * 60e3, charla: true } } } }).length, 0, 'not comments from before turning notifications on');
assert.equal(run({ cup: { ...cup, meta: { ...cup.meta, end: now - 1 } } }).length, 0, 'not once the cup ended');

// They do not use up the cup's daily CAP
assert.equal(sentToday({ 'charla:1:bea': now, 'dia:1': now - H }, now, 'America/Santiago'), 1);

console.log('✓ cup talk notifications');
