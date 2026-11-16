// The heartbeat's measure (D-565).
import assert from 'node:assert/strict';
import { beat, oldDays, health, pacificDate, LATE_MIN } from './heartbeat.mjs';

const MIN = 60e3;
const now = Date.UTC(2026, 10, 16, 20, 0); // 12:00 Pacific
assert.equal(pacificDate(now), '2026-11-16');
assert.equal(pacificDate(Date.UTC(2026, 10, 17, 5, 0)), '2026-11-16', 'the day is cut in Pacific time');

let r = beat({ prev: now - 5 * MIN, today: { maxHueco: 7 }, now });
assert.equal(r.gap, 5);
assert.deepEqual(r.changes['stats/prod/push/dias/2026-11-16/vueltas'], { '.sv': { increment: 1 } });
assert.ok(!('stats/prod/push/dias/2026-11-16/maxHueco' in r.changes), 'a shorter gap leaves the longest');
r = beat({ prev: now - 42 * MIN, today: { maxHueco: 7 }, now });
assert.equal(r.changes['stats/prod/push/dias/2026-11-16/maxHueco'], 42);
assert.equal(beat({ prev: null, now }).gap, 0, 'the first round ever has no gap');

assert.deepEqual(oldDays({ '2026-08-01': {}, '2026-11-01': {} }, now), ['2026-08-01']);

const good = { vuelta: now - 4 * MIN, uadAt: now - 30 * MIN, dias: { '2026-11-15': { vueltas: 280, maxHueco: 6, uad: 24 } }, now };
assert.deepEqual(health(good), { ok: true, problems: [] });
assert.equal(health({ ...good, vuelta: now - 3 * 60 * MIN }).ok, false, 'stopped');
assert.equal(health({ ...good, uadAt: now - 5 * 60 * MIN }).ok, false, 'no rebuild');
assert.match(health({ ...good, dias: { '2026-11-15': { vueltas: 30, maxHueco: LATE_MIN + 1, uad: 24 } } }).problems[0], /longest gap/);
assert.match(health({ ...good, dias: {} }).problems[0], /no rounds recorded/);
console.log('✓ heartbeat');
