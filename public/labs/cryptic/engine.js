/**
 * Cryptic: the rules as a pure state machine (C-2): no DOM, no global state, testable in node.
 *
 * One clue a day, the same for everyone on that date (the player's own midnight). The player types the
 * answer as many times as needed; up to three hints (the kind of wordplay, the definition, the first
 * letter) each cost a star; giving up shows the answer and scores none. Old clues can be played as
 * practice, which counts for nothing.
 */

/** The day the game started: its clue is number 1. */
export const LAUNCH = '2026-11-19';
export const MAX_HINTS = 3;
export const MAX_STARS = 3;

const two = n => String(n).padStart(2, '0');
/** The player's date today, in their time zone: `2026-11-19`. */
export function localDate(ms = Date.now()) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}
const utc = f => { const [y, m, d] = f.split('-').map(Number); return Date.UTC(y, m - 1, d); };
/** Days from `a` to `b`. */
export const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / 86400000);
/** `date` plus `n` days. */
export const addDays = (date, n) => new Date(utc(date) + n * 86400000).toISOString().slice(0, 10);
/** The clue's number, the one that is shared: the launch day is #1 (and so is a day before it, west of the launch). */
export const numberOf = date => Math.max(1, daysBetween(LAUNCH, date) + 1);

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** A step that visits every clue once before any repeats, and does not walk the bank in its written order. */
const strideFor = n => [7, 11, 13, 17, 19, 23].find(p => gcd(p, n) === 1) || 1;
/** Which clue of a bank of `size` a date gets. */
export function indexOf(date, size) {
  const n = ((daysBetween(LAUNCH, date)) % size + size) % size;
  return (n * strideFor(size)) % size;
}

/** Capitals without accents, Ñ kept, and only letters: «Jamón » → «JAMON». */
export const normalize = s => String(s || '').toUpperCase()
  .replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ')
  .replace(/[^A-ZÑ]/g, '');

/** The length as the clue shows it: «(4)», or «(3,4)» for two words. */
export const enumeration = answer => '(' + String(answer).split(/[\s-]+/).map(w => normalize(w).length).join(',') + ')';

/** A new round for clue `index`; `practice` rounds count for nothing. */
export const newRound = (index, { date = null, practice = false } = {}) =>
  ({ index, date, practice, guesses: [], hints: 0, solved: false, gaveUp: false });

export const isOver = state => state.solved || state.gaveUp;

/**
 * The verdict of a guess: `{ state, verdict }`, with verdict `right`, `wrong`, `length` (not the
 * answer's length: it is not counted) or `empty`. Nothing moves once the round is over.
 */
export function guess(state, text, clue) {
  const g = normalize(text);
  if (isOver(state)) return { state, verdict: 'over' };
  if (!g) return { state, verdict: 'empty' };
  const want = normalize(clue.a);
  if (g.length !== want.length) return { state, verdict: 'length' };
  const right = g === want;
  return { state: { ...state, guesses: [...state.guesses, g], solved: right }, verdict: right ? 'right' : 'wrong' };
}

/** One more hint, up to MAX_HINTS. */
export const hint = state => (isOver(state) || state.hints >= MAX_HINTS ? state : { ...state, hints: state.hints + 1 });

/** Shows the answer: the round ends with no stars. */
export const giveUp = state => (isOver(state) ? state : { ...state, gaveUp: true });

/** Stars of a round: three minus the hints, none if given up. */
export const stars = state => (state.solved ? MAX_STARS - state.hints : 0);

/**
 * The streak: days in a row with the day's clue solved, up to today (or up to yesterday, while today's
 * is not solved yet). `days` is { 'YYYY-MM-DD': { solved } }.
 */
export function streak(days, today) {
  let d = days[today]?.solved ? today : addDays(today, -1);
  let n = 0;
  while (days[d]?.solved) { n++; d = addDays(d, -1); }
  return n;
}

/** Is `jid` the player who wrote `clue`? Clues a player proposed carry `by: { n, j }` (the owner, 2026-11-19). */
export const isAuthor = (clue, jid) => !!jid && clue?.by?.j === jid;

/** The clues practice may draw: all but today's (`skip`) and the player's own. */
export const practicePool = (bank, skip, jid) => bank.map((_, i) => i).filter(i => i !== skip && !isAuthor(bank[i], jid));
