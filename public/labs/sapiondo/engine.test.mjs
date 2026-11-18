import assert from 'node:assert/strict';
import {
  newGame, step, act, serialize, hydrate,
  COLS, FINISH_ROW, STEP, DASH_CD, PTS_LANE, PTS_FINISH,
} from './engine.js';

// 1. Seeded repeatability: same seed builds identical lanes, vehicles, and fruits
const a = newGame({ seed: 7777 });
const b = newGame({ seed: 7777 });
assert.deepEqual(
  a.lanes.map(l => ({ dir: l.dir, speed: l.speed, xs: l.vehicles.map(v => v.x) })),
  b.lanes.map(l => ({ dir: l.dir, speed: l.speed, xs: l.vehicles.map(v => v.x) })),
  'identical seed creates identical traffic',
);
assert.deepEqual(a.fruits, b.fruits, 'identical seed creates identical fruit placement');

// 2. Movement rules: forward, left, right only (clamped to board bounds, no backward)
const g = newGame({ seed: 1234 });
for (const l of g.lanes) l.vehicles = []; // isolate movement bounds from traffic
assert.equal(act(g, 'up'), true);
assert.equal(g.mode, 'play');
for (let i = 0; i < 30; i++) step(g, STEP);
assert.equal(g.frog.row, 1);
assert.equal(g.maxRow, 1);
assert.ok(g.score >= PTS_LANE);

for (let i = 0; i < 4; i++) {
  act(g, 'left');
  for (let k = 0; k < 25; k++) step(g, STEP);
}
assert.equal(g.frog.col, 0, 'clamps at left edge');
assert.equal(act(g, 'left'), false, 'cannot move past column 0');

for (let i = 0; i < COLS + 2; i++) {
  act(g, 'right');
  for (let k = 0; k < 25; k++) step(g, STEP);
}
assert.equal(g.frog.col, COLS - 1, 'clamps at right edge');
assert.equal(act(g, 'back'), false, 'no backward movement supported');

// 3. Dash leaps 2 rows and goes on cooldown
const d = newGame({ seed: 2026 });
for (const l of d.lanes) l.vehicles = []; // clear road to verify pure dash mechanics
assert.equal(act(d, 'dash'), true);
assert.ok(d.dashCd > d.dashCooldownDur - 0.1);
for (let i = 0; i < 30; i++) step(d, STEP);
assert.equal(d.frog.row, 2, 'dash advances 2 rows');
assert.equal(act(d, 'dash'), false, 'dash cannot re-trigger while on cooldown');

// 3b. Hard difficulty has denser traffic / faster speeds than Normal
const norm = newGame({ seed: 7777, difficulty: 'normal' });
const hard = newGame({ seed: 7777, difficulty: 'hard' });
const normCars = norm.lanes.reduce((s, l) => s + l.vehicles.length, 0);
const hardCars = hard.lanes.reduce((s, l) => s + l.vehicles.length, 0);
assert.ok(hardCars > normCars, `hard (${hardCars}) has more traffic than normal (${normCars})`);

// 4. Airborne dash over a vehicle clears it and triggers aerial close-call
const aerial = newGame({ seed: 3030 });
for (const l of aerial.lanes) l.vehicles = [];
aerial.lanes[1].vehicles = [{ id: 't1', type: 'sedan', len: 1.3, color: 'coral', x: 2.8, grazed: false }];
aerial.lanes[1].speed = 0;
act(aerial, 'dash');
for (let i = 0; i < 30; i++) step(aerial, STEP);
assert.equal(aerial.mode, 'play', 'dash leaps cleanly over vehicle in row 1');
assert.equal(aerial.frog.row, 2);
assert.equal(aerial.closeCalls, 1, 'aerial pass counts as close-call');
assert.ok(aerial.bonusScore > 0);

// 5. Collision ends the run as crash
const crashGame = newGame({ seed: 4040 });
for (const l of crashGame.lanes) l.vehicles = [];
crashGame.lanes[1].vehicles = [{ id: 'c1', type: 'bus', len: 2.3, color: 'bus', x: 2.2, grazed: false }];
crashGame.lanes[1].speed = 0;
act(crashGame, 'up');
for (let i = 0; i < 30; i++) step(crashGame, STEP);
assert.equal(crashGame.mode, 'crash');

// 6. Reaching FINISH_ROW awards finish bonus + time bonus
const winGame = newGame({ seed: 5050 });
for (const l of winGame.lanes) l.vehicles = [];
winGame.frog.row = FINISH_ROW - 1;
winGame.frog.fromRow = FINISH_ROW - 1;
winGame.frog.toRow = FINISH_ROW - 1;
winGame.frog.y = FINISH_ROW - 1;
winGame.maxRow = FINISH_ROW - 1;
act(winGame, 'up');
for (let i = 0; i < 30; i++) step(winGame, STEP);
assert.equal(winGame.mode, 'win');
assert.ok(winGame.timeBonus > 0);
assert.equal(winGame.distanceScore, FINISH_ROW * PTS_LANE + PTS_FINISH);

// 7. Serialize / hydrate preserves progress for session.js resume
const snap = serialize(d);
const restored = hydrate(snap);
assert.equal(restored.seed, d.seed);
assert.equal(restored.frog.row, d.frog.row);
assert.equal(restored.score, d.score);

console.log('sapiondo engine.test.mjs ok');
