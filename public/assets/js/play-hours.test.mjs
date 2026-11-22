// The hours games end at (lab flag profile's 🌅 and 🦉): early 04:00–06:59, night 00:00–03:59, local time, 60 days kept.
import assert from 'node:assert/strict';
import { addHour, readHours, noteHour, HOURS_KEY, addRun, readRun, noteRun } from './play-hours.js';

const at = (d, h, m = 0) => new Date(2026, 10, d, h, m).getTime();
let log = addHour({}, at(5, 6, 59));
assert.deepEqual(log, { '2026-11-05': { e: 1 } });
log = addHour(log, at(5, 3, 30));
assert.deepEqual(log, { '2026-11-05': { e: 1, n: 1 } });
assert.equal(addHour(log, at(5, 7)), log, 'from 7 on, nothing is noted');
assert.equal(addHour(log, at(5, 23, 59)), log);
let big = {};
for (let i = 0; i < 70; i++) big = addHour(big, new Date(2026, 0, 1 + i, 5).getTime());
assert.equal(Object.keys(big).length, 60, 'the last 60 days only');
assert.ok(!('2026-01-01' in big));

const mem = new Map();
const store = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
noteHour(store, at(9, 5));
noteHour(store, at(9, 5, 30));
noteHour(store, at(9, 12));
assert.deepEqual(readHours(store), { '2026-11-09': { e: 2 } });
assert.ok(mem.has(HOURS_KEY));
mem.set(HOURS_KEY, 'not json');
assert.deepEqual(readHours(store), {}, 'a broken log reads as empty');
noteHour({ getItem: () => { throw new Error('x'); } }, at(9, 5)); // never throws
console.log('play hours: ok');

// The run of one same game in a row (🎵 Es una obsesión)
let run = {};
for (let i = 0; i < 4; i++) run = addRun(run, 'queens');
assert.deepEqual(run, { g: 'queens', n: 4, best: 4 });
run = addRun(run, 'tango');
assert.deepEqual(run, { g: 'tango', n: 1, best: 4 }, 'another game starts over and keeps the best');
assert.equal(addRun(run, undefined), run, 'no game, nothing noted');
const mem2 = new Map();
const store2 = { getItem: k => mem2.get(k) ?? null, setItem: (k, v) => mem2.set(k, v) };
for (let i = 0; i < 10; i++) noteRun('sudoku', store2);
assert.equal(readRun(store2).best, 10);
console.log('✓ play-hours run');
