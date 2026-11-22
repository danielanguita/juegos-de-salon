/**
 * The player's badges (lab flag `profile`): what each one asks, computed from what the profile page
 * reads. Pure, for node: `earned(facts)` takes the facts and returns one entry per badge.
 *
 * A badge has a tier (bronze, silver, gold), a group (daily, cup, games) and is either visible from
 * the start, locked until earned (greyed, with its progress when it has one), or secret (`secret`):
 * a secret one shows as «?» until it is earned. Some count how many times (`count`: Cup wins).
 *
 * The facts (every field optional, a missing one counts as nothing):
 *   bestStreak     the longest Uno al día streak (with its wildcards)
 *   dailyDays      { 'YYYY-MM-DD': true } the days Uno al día was played
 *   months         [{ period: 'sYYYY-MM', place }] the player's place in each finished month's points
 *   medals         { gold, silver, bronze } La Copa's podiums (records.js `medallero`)
 *   cups           how many cups the player sat in
 *   hosted         how many of them the player created
 *   plays          games finished with the player
 *   gamesPlayed    how many different games the player has finished
 *   gamesTotal     how many games there are to play
 *   firsts         in how many games the player is 1st this week or ever
 *   allRounder     the player's place in the overall ranking, ever (null if not in it)
 *   hours          { 'YYYY-MM-DD': { e, n } } games finished early (04:00–06:59) and at night (00:00–03:59), by local day
 *   bestRun        the most times this phone finished one same game in a row
 *   since          when the player was created (ms)
 *   now            ms
 */

export const GROUPS = ['daily', 'cup', 'games'];
export const EARLY_GAMES = 3;   // games before 7 in one morning…
export const EARLY_DAYS = 7;    // …on this many mornings
export const NIGHT_GAMES = 3;   // games between midnight and 4 in one night
export const RUN_GAMES = 10;    // one same game in a row

/** Whole calendar months fully played in `days` (`{ 'YYYY-MM-DD': true }`), up to `today`. */
export function fullMonths(days = {}, today = '9999-12-31') {
  const by = {};
  for (const d of Object.keys(days)) if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today) by[d.slice(0, 7)] = (by[d.slice(0, 7)] || 0) + 1;
  return Object.entries(by).filter(([m, n]) => {
    const [y, mo] = m.split('-').map(Number);
    const len = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    return n >= len && `${m}-${String(len).padStart(2, '0')}` <= today;
  }).map(([m]) => m).sort();
}

const n = x => (Number.isFinite(x) ? x : 0);
const progress = (cur, goal) => ({ got: n(cur) >= goal, progress: [Math.min(n(cur), goal), goal] });

/**
 * The catalogue, in the order the page shows it. `check(f)` says `{ got, count?, progress? }`.
 * The texts are in texts.js under the badge's id.
 */
export const BADGES = [
  // Uno al día
  { id: 'streak-10', group: 'daily', tier: 'bronze', icon: '🔥', check: f => progress(f.bestStreak, 10) },
  { id: 'streak-30', group: 'daily', tier: 'silver', icon: '🔥', check: f => progress(f.bestStreak, 30) },
  { id: 'streak-100', group: 'daily', tier: 'gold', icon: '🔥', check: f => progress(f.bestStreak, 100) },
  { id: 'month-full', group: 'daily', tier: 'silver', icon: '🗓️', check: f => { const c = fullMonths(f.dailyDays, f.today).length; return { got: c > 0, count: c }; } },
  { id: 'month-podium', group: 'daily', tier: 'bronze', icon: '🏅', check: f => { const c = (f.months || []).filter(m => m.place >= 1 && m.place <= 3).length; return { got: c > 0, count: c }; } },
  { id: 'month-champion', group: 'daily', tier: 'gold', icon: '👑', check: f => { const c = (f.months || []).filter(m => m.place === 1).length; return { got: c > 0, count: c }; } },
  { id: 'early-bird', group: 'daily', tier: 'silver', icon: '🌅', check: f => progress(Object.values(f.hours || {}).filter(h => n(h?.e) >= EARLY_GAMES).length, EARLY_DAYS) },
  // La Copa
  { id: 'cup-first', group: 'cup', tier: 'bronze', icon: '🎟️', check: f => ({ got: n(f.cups) >= 1 }) },
  { id: 'cup-five', group: 'cup', tier: 'silver', icon: '🎪', check: f => progress(f.cups, 5) },
  { id: 'cup-host', group: 'cup', tier: 'silver', icon: '🎤', check: f => progress(f.hosted, 3) },
  { id: 'cup-podium', group: 'cup', tier: 'bronze', icon: '🥉', check: f => { const m = f.medals || {}; const c = n(m.gold) + n(m.silver) + n(m.bronze); return { got: c > 0, count: c }; } },
  { id: 'cup-champion', group: 'cup', tier: 'gold', icon: '🏆', check: f => { const c = n(f.medals?.gold); return { got: c > 0, count: c }; } },
  // Games
  { id: 'explorer', group: 'games', tier: 'bronze', icon: '🧭', check: f => progress(f.gamesPlayed, 10) },
  { id: 'collector', group: 'games', tier: 'gold', icon: '🧩', check: f => progress(f.gamesPlayed, Math.max(1, n(f.gamesTotal))) },
  { id: 'plays-100', group: 'games', tier: 'bronze', icon: '🎲', check: f => progress(f.plays, 100) },
  { id: 'plays-1000', group: 'games', tier: 'gold', icon: '🎲', check: f => progress(f.plays, 1000) },
  { id: 'obsession', group: 'games', tier: 'silver', icon: '😬', check: f => progress(f.bestRun, RUN_GAMES) },
  { id: 'number-one', group: 'games', tier: 'gold', icon: '🥇', check: f => ({ got: n(f.firsts) > 0, count: n(f.firsts) }) },
  { id: 'all-rounder', group: 'games', tier: 'silver', icon: '🎯', check: f => ({ got: Number.isInteger(f.allRounder) && f.allRounder >= 1 && f.allRounder <= 10 }) },
  // Secret: shown as «?» until earned
  { id: 'night-owl', group: 'games', tier: 'silver', icon: '🦉', secret: true, check: f => ({ got: Object.values(f.hours || {}).some(h => n(h?.n) >= NIGHT_GAMES) }) },
  { id: 'triple-crown', group: 'games', tier: 'gold', icon: '💎', secret: true, check: f => ({ got: n(f.medals?.gold) > 0 && (f.months || []).some(m => m.place === 1) && n(f.firsts) > 0 }) },
  { id: 'one-year', group: 'games', tier: 'gold', icon: '🎂', secret: true, check: f => ({ got: n(f.since) > 0 && n(f.now) - f.since >= 365 * 86400000 }) },
];

/**
 * Every badge with its state: `{ ...badge, got, count, progress, new }`. `seen` is what this phone
 * already showed (`{ id: ms }`): a badge earned before stays earned (a first place lost this week
 * keeps its badge), and one not in `seen` is new. Returns `{ list, seen }` with `seen` updated.
 */
export function earned(facts = {}, seen = {}) {
  const now = n(facts.now) || Date.now();
  const out = { ...seen };
  const list = BADGES.map(b => {
    let r;
    try { r = b.check(facts) || {}; } catch (_) { r = {}; }
    const got = !!r.got || !!seen[b.id];
    const fresh = got && !seen[b.id];
    if (fresh) out[b.id] = now;
    return { ...b, got, count: r.count || 0, progress: got ? null : r.progress || null, new: fresh };
  });
  return { list, seen: out };
}
