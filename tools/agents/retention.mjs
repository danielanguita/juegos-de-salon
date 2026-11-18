// The retention loop's numbers (learning piece 7, docs/learning/07-retention-loop.md). Week by closed
// week (Pacific, D-561): of the browsers that played a game on a day, the share that played again the
// next day (any game: the headline), and Uno al día's next-day return as the report counts it
// (secondary). Each week is read against the noise band of the eight before it: a drop counts when
// two weeks in a row fall under mean − 1 sd, or one week under mean − 2 sd; fewer than 20 players in
// the week is "too few to read". No model, no player identity: counts only.
//   node tools/agents/retention.mjs check            the last weeks, the band, and the verdict
//   node tools/agents/retention.mjs record           check, then write the closed week to docs/retention.json
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MIN_PLAYERS = 20, HISTORY = 8;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const LEDGER = join(ROOT, 'docs/retention.json');

/** Next-day return of players in days [from, to]: { pct, players } (players = distinct ids that played). */
export function anyReturn(porDia, { from, to }) {
  let base = 0, back = 0; const ids = new Set();
  for (let d = from; d <= to; d++) {
    const today = porDia[d], next = porDia[d + 1];
    if (!today) continue;
    for (const [id, v] of today) {
      if (v < 2) continue;
      ids.add(id); base++;
      if (next?.get(id) === 2) back++;
    }
  }
  return { pct: base ? Math.round((back / base) * 1000) / 10 : null, players: ids.size };
}

/** The band of a series: { mean, sd, floor, deep }. */
export function band(values) {
  const v = values.filter(x => typeof x === 'number');
  if (v.length < 3) return null;
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
  const r = x => Math.round(x * 10) / 10;
  return { mean: r(mean), sd: r(sd), floor: r(mean - sd), deep: r(mean - 2 * sd) };
}

/**
 * The verdict on the latest week of `series` (oldest first, each { pct, players }): 'too-few',
 * 'no-history', 'drop' (with why) or 'within-noise'. The band is the HISTORY weeks before the last two.
 */
export function verdict(series) {
  const last = series.at(-1), prev = series.at(-2);
  if (!last || last.pct === null || last.players < MIN_PLAYERS) return { kind: 'too-few' };
  const b = band(series.slice(-(HISTORY + 2), -2).map(x => x.pct));
  if (!b) return { kind: 'no-history' };
  if (last.pct < b.deep) return { kind: 'drop', why: `${last.pct}% is under twice the band (${b.deep}%)`, band: b };
  if (last.pct < b.floor && prev && prev.pct !== null && prev.pct < b.floor) return { kind: 'drop', why: `two weeks under the band's floor (${prev.pct}%, ${last.pct}% < ${b.floor}%)`, band: b };
  return { kind: 'within-noise', band: b };
}

async function weeks(n) {
  const { token, read } = await import('../firebase/firebase-admin.mjs');
  const { activeByDay } = await import('../../public/panel/dominios.js');
  const { closedWeek, toPacificDays } = await import('../../public/panel/wbr.js');
  const w = closedWeek(Date.now());
  const days = toPacificDays(await read('stats/prod/days', await token(), { orderBy: '$key', startAt: String(w.from - 7 * n - 2) }) || {});
  const porDia = activeByDay(days);
  const out = [];
  for (let k = n - 1; k >= 0; k--) {
    const from = w.from - 7 * k, to = from + 6;
    out.push({ week: from, ...anyReturn(porDia, { from, to }) });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2] || 'check';
  const series = await weeks(HISTORY + 2);
  const iso = d => new Date(d * 864e5).toISOString().slice(0, 10);
  for (const s of series) console.log(`${iso(s.week)}  next-day return ${s.pct ?? '—'}%  (${s.players} players)`);
  const v = verdict(series);
  console.log(`\nVerdict: ${v.kind}${v.why ? ` — ${v.why}` : ''}${v.band ? ` (band: mean ${v.band.mean}%, sd ${v.band.sd})` : ''}`);
  if (cmd === 'record') {
    const ledger = JSON.parse(readFileSync(LEDGER, 'utf8'));
    const last = series.at(-1);
    ledger.weeks = [...ledger.weeks.filter(x => x.week !== iso(last.week)), { week: iso(last.week), pct: last.pct, players: last.players, verdict: v.kind }].slice(-52);
    writeFileSync(LEDGER, JSON.stringify(ledger, null, 2) + '\n');
    console.log(`Recorded ${iso(last.week)} in docs/retention.json.`);
  }
}
