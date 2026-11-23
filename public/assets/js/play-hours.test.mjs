// The hours games end at (lab flag profile's 🌅 and 🦉): early 04:00–06:59, night 00:00–03:59, local time, 60 days kept.
import assert from 'node:assert/strict';
import { addHour, readHours, noteHour, HOURS_KEY, addRun, readRun, noteRun, addMark, readMarks, noteMark, MARKS_KEY } from './play-hours.js';

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

// The marks kept for good: first day per game, special days, weekends, early Mondays
const on = (y, mo, d, h = 12) => new Date(y, mo - 1, d, h).getTime();
let marks = addMark({}, 'queens', on(2026, 12, 25, 20));
assert.deepEqual(marks, { first: { queens: '2026-12-25' }, days: { xmas: true }, played: ['2026-12-25'] });
marks = addMark(marks, 'queens', on(2027, 1, 1, 0));
assert.deepEqual(marks.first, { queens: '2026-12-25' }, 'the first day stays');
marks = addMark(addMark(marks, 'tango', on(2026, 9, 18)), 'tango', on(2026, 10, 31));
assert.deepEqual(marks.days, { xmas: true, newyear: true, fiestas: true, halloween: true });
// Saturday 21 and Sunday 22 November 2026: one weekend; a Sunday alone is none
let wk = addMark({}, 'x', on(2026, 11, 22));
assert.equal(wk.wk, undefined, 'a Sunday without its Saturday');
wk = addMark(addMark(addMark({}, 'x', on(2026, 11, 21)), 'x', on(2026, 11, 22)), 'x', on(2026, 11, 22, 20));
assert.deepEqual(wk.wk, ['2026-11-21'], 'once per weekend');
wk = addMark(addMark(wk, 'x', on(2026, 11, 28)), 'x', on(2026, 11, 30));
assert.deepEqual(wk.wk, ['2026-11-21'], 'a Saturday and the Monday after are not a weekend');
// Monday 23 November 2026
assert.deepEqual(addMark({}, 'x', on(2026, 11, 23, 7)).mon, ['2026-11-23'], 'a Monday before 8');
assert.equal(addMark({}, 'x', on(2026, 11, 23, 8)).mon, undefined, 'a Monday from 8 on');
let mons = {};
for (let i = 0; i < 40; i++) mons = addMark(mons, 'x', on(2026, 1, 5 + 7 * i, 6));
assert.equal(mons.mon.length, 30, 'the last 30 Mondays kept');
assert.deepEqual(addMark({}, undefined, on(2026, 11, 10)).first, {}, 'no game, no first day');
const mem3 = new Map();
const store3 = { getItem: k => mem3.get(k) ?? null, setItem: (k, v) => mem3.set(k, v) };
noteMark('hangman', store3, on(2026, 11, 10));
assert.deepEqual(readMarks(store3), { first: { hangman: '2026-11-10' }, days: {}, played: ['2026-11-10'] });
assert.deepEqual(addMark(addMark({}, 'a', on(2026, 11, 10)), 'b', on(2026, 11, 10, 20)).played, ['2026-11-10'], 'a day once');
assert.ok(mem3.has(MARKS_KEY));
noteMark('x', { getItem: () => { throw new Error('x'); } }); // never throws
console.log('✓ play-hours marks');
