// Run: node tools/e2e/groups.test.mjs
// The end-to-end groups (D-307): even, deterministic, with every script once, and not over the
// target unless a single script is. And that the repo's fit in the runners.
import assert from 'node:assert/strict';
import { group, duration, readDurations, TARGET_S, MAXIMUM, UNMEASURED_S } from './groups.mjs';
import { jobs } from './ci.mjs';

const dur = { a: 200, b: 150, c: 120, d: 100, e: 60, f: 30 };
const g = group(Object.keys(dur), dur, { target: 250 });
assert.equal(g.length, 3, '660 s in groups of up to 250: three');
assert.deepEqual(g.flatMap(x => x.scripts).sort(), Object.keys(dur), 'each script, once');
assert.ok(g.every(x => x.s <= 250), `none goes over the target: ${g.map(x => x.s)}`);
assert.deepEqual(group(Object.keys(dur), dur, { target: 250 }), g, 'the same data, the same groups');
assert.match(g[0].name, /^g01 · \S+ \+\d+$/);
// A script longer than the target rules: it goes alone in its group, and becomes the target
assert.deepEqual(group(['long', 'x', 'y'], { long: 500, x: 10, y: 20 }, { target: 100 }).map(g => g.scripts), [['long'], ['y', 'x']]);
assert.equal(group([], dur).length, 0);
assert.equal(duration('new.mjs', {}), UNMEASURED_S, 'an unmeasured script counts as 90 s');
// An unmeasured job counts as its measured siblings' median (D-585): the other parts of its script, else the same file in other folders
const sib = { 'conformance.mjs:a': 10, 'conformance.mjs:b': 12, 'conformance.mjs:c': 30, 'x/game.mjs': 40, 'y/game.mjs': 50, 'z/lab.mjs': 20 };
assert.equal(duration('conformance.mjs:new', sib), 12, 'a new part: the median of its script\'s parts');
assert.equal(duration('w/game.mjs', sib), 45, 'a new game\'s script: the median of the same file in the other games');
assert.equal(duration('w/lab.mjs', sib), UNMEASURED_S, 'one sibling is not enough');
assert.equal(duration('new.mjs', sib), UNMEASURED_S, 'a top-level script has no siblings');
assert.equal(duration('x/game.mjs', sib), 40, 'a measured job keeps its time');
assert.equal(group(['a', 'b', 'c'], {}, { target: 1, maximum: 2 }).length, 2, 'never more than the maximum');

// The repo's: in groups that fit at once in the runners (the unmeasured ones estimated from their siblings)
const measured = readDurations();
const unmeasured = jobs().filter(t => !(t in measured));
if (unmeasured.length) console.log(`  not measured yet (estimated from their siblings): ${unmeasured.map(t => `${t} ${duration(t, measured)} s`).join(', ')}`);
const real = group(jobs(), measured);
assert.ok(real.length <= MAXIMUM, `${real.length} groups: more than the runners`);
const longest = Math.max(...jobs().map(t => duration(t, measured)));
// Rounded: 400 × 1.15 is 459.99999999999994 in floating point, and a 460 s group failed main on it
const alarm = Math.round(Math.max(TARGET_S, longest) * 1.15);
assert.ok(real[0].s <= alarm, `the heaviest group (${real[0].s} s) goes far over the target: cut browser time or propose the next TARGET_S (D-585)`);
console.log(`groups: green · ${real.length} groups, the longest ${real[0].s} s, ${Math.floor(alarm - real[0].s)} s of headroom before the alarm`);
