// The profile's badges (lab flag profile): each one is earned by what it says, stays earned, and is new once.
import assert from 'node:assert/strict';
import { BADGES, GROUPS, earned, fullMonths, EARLY_GAMES, EARLY_DAYS } from './badges.js';

const ids = BADGES.map(b => b.id);
assert.equal(new Set(ids).size, ids.length, 'one id per badge');
for (const b of BADGES) {
  assert.ok(GROUPS.includes(b.group), `${b.id}: a known group`);
  assert.ok(['bronze', 'silver', 'gold'].includes(b.tier), `${b.id}: a known tier`);
  assert.ok(b.icon, `${b.id}: an icon`);
}
assert.ok(BADGES.some(b => b.secret), 'some badges are secret (the owner, 2026-11-21)');

const of = (facts, seen) => Object.fromEntries(earned(facts, seen).list.map(b => [b.id, b]));
const NOW = Date.UTC(2026, 10, 21, 12);

// Nothing played: nothing earned, the streaks show their progress, the secret ones none
let x = of({ now: NOW });
assert.ok(Object.values(x).every(b => !b.got), 'nothing earned with no facts');
assert.deepEqual(x['streak-10'].progress, [0, 10]);
assert.equal(x['night-owl'].progress, null, 'a secret badge tells no progress');

// Streaks and counts
x = of({ now: NOW, bestStreak: 14, medals: { gold: 3, silver: 1 }, cups: 5, plays: 120, gamesPlayed: 12, gamesTotal: 40 });
assert.ok(x['streak-10'].got && !x['streak-30'].got);
assert.deepEqual(x['streak-30'].progress, [14, 30]);
assert.ok(x['cup-champion'].got && x['cup-champion'].count === 3, 'a Cup champion counts each cup');
assert.equal(x['cup-podium'].count, 4);
assert.ok(x['cup-five'].got && x['plays-100'].got && x.explorer.got && !x.collector.got);
assert.deepEqual(x.collector.progress, [12, 40]);

// The early bird: 3 games before 7 on 7 mornings (the owner's example); 2 games a morning do not count
const mornings = (k, games) => Object.fromEntries([...Array(k)].map((_, i) => [`2026-11-${String(i + 1).padStart(2, '0')}`, { e: games }]));
assert.ok(of({ now: NOW, hours: mornings(EARLY_DAYS, EARLY_GAMES) })['early-bird'].got);
assert.ok(!of({ now: NOW, hours: mornings(EARLY_DAYS, EARLY_GAMES - 1) })['early-bird'].got);
assert.deepEqual(of({ now: NOW, hours: mornings(4, 3) })['early-bird'].progress, [4, 7]);
assert.ok(of({ now: NOW, hours: { '2026-11-02': { n: 3 } } })['night-owl'].got, 'the night owl: 3 games in one night');

// Months of Uno al día
assert.ok(of({ now: NOW, months: [{ period: 's2026-10', place: 1 }] })['month-champion'].got);
assert.ok(of({ now: NOW, months: [{ period: 's2026-10', place: 3 }] })['month-podium'].got);
assert.ok(!of({ now: NOW, months: [{ period: 's2026-10', place: null }] })['month-podium'].got);
const october = Object.fromEntries([...Array(31)].map((_, i) => [`2026-10-${String(i + 1).padStart(2, '0')}`, true]));
assert.deepEqual(fullMonths(october, '2026-11-21'), ['2026-10']);
assert.deepEqual(fullMonths(october, '2026-10-30'), [], 'a month is full only once it has ended');
assert.deepEqual(fullMonths({ ...october, '2026-10-31': undefined }, '2026-11-21').length, 1);
const missing = { ...october }; delete missing['2026-10-15'];
assert.deepEqual(fullMonths(missing, '2026-11-21'), []);

// The triple crown, secret, needs the three
assert.ok(of({ now: NOW, medals: { gold: 1 }, months: [{ place: 1 }], firsts: 1 })['triple-crown'].got);
assert.ok(!of({ now: NOW, medals: { gold: 1 }, firsts: 1 })['triple-crown'].got);
// One year since the player was created
assert.ok(of({ now: NOW, since: NOW - 366 * 86400000 })['one-year'].got);
assert.ok(!of({ now: NOW, since: NOW - 100 * 86400000 })['one-year'].got);

// Earned once, earned for good; new only the first time
const first = earned({ now: NOW, firsts: 1 }, {});
assert.ok(first.list.find(b => b.id === 'number-one').new, 'new the first time');
assert.equal(first.seen['number-one'], NOW);
const later = earned({ now: NOW + 1000, firsts: 0 }, first.seen);
const one = later.list.find(b => b.id === 'number-one');
assert.ok(one.got && !one.new, 'a first place lost this week keeps its badge, no longer new');
// 😬 Se llama obsesión: one same game 10 times in a row (the owner, 2026-11-21)
const obs = f => earned({ now: NOW, ...f }).list.find(b => b.id === 'obsession');
assert.deepEqual(obs({ bestRun: 7 }).progress, [7, 10]);
assert.ok(!obs({ bestRun: 9 }).got && obs({ bestRun: 10 }).got);
console.log('profile badges: ok');
