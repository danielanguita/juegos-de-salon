// The WBR's weeks and highlights: node public/panel/wbr.test.mjs (the trend itself: tools/reports/weekly-data.test.mjs)
import assert from 'node:assert/strict';
import { closedWeek, currentWeek, weekOf, isoDay, highlights, trendStart, toPacificDays, pacificDay, pacificEndMs } from './wbr.js';

const now = Date.parse('2026-11-15T12:00:00Z');
const w = closedWeek(now);
assert.deepEqual([isoDay(w.from), isoDay(w.to)], ['2026-11-08', '2026-11-14']);
assert.deepEqual(weekOf('2026-11-07', now), { from: w.from - 7, to: w.to - 7 }, 'a Saturday names its week');
assert.deepEqual(weekOf('2026-11-03', now), { from: w.from - 7, to: w.to - 7 }, 'any day names the week holding it');
assert.deepEqual(weekOf('2026-11-15', now), w, 'a week not closed yet falls back to the closed one');
assert.deepEqual(weekOf('nonsense', now), w);
assert.deepEqual([isoDay(currentWeek(now).from), isoDay(currentWeek(now).to)], ['2026-11-15', '2026-11-15'], 'Sunday: the week in progress is one day');
assert.deepEqual(currentWeek(Date.parse('2026-11-20T03:00:00Z')).to, Math.floor(Date.parse('2026-11-19T00:00:00Z') / 864e5), 'by the Pacific date');
assert.match(highlights({ cerrada: 1, metricas: [{ valores: [9, 574, 494], cambio: 16 }], juegos: [] })[0], /574 vs\. 494/, 'highlights read the closed week, not the partial one');
assert.equal(isoDay(trendStart(w)), '2026-09-01', 'two months back, from the first');
const h = highlights({ metricas: [{ valores: [574, 494], cambio: 16 }], juegos: [{ juego: 'Flap', valores: [186], nuevo: 'Nov 9, 2026' }, { juego: 'Shinobi', valores: [176] }] });
assert.equal(h[0], 'Games finished rose 16% (574 vs. 494).');
assert.match(h[1], /Most finished: Flap \(186 games finished\), then Shinobi \(176\)/);
assert.match(h[2], /Flap \(out Nov 9\)/);
assert.match(highlights({ metricas: [], juegos: [], sinTerminar: [{ juego: 'Zip', empiezan: 4, columna: 'Nov 15–18*' }] })[0], /Zip: 4 browsers started it in Nov 15–18\* and none finished it/, 'a game started and never finished is flagged');
// Pacific dates (D-561)
const D = Math.floor(Date.parse('2026-11-15T00:00:00Z') / 864e5), H = 3600e3;
assert.equal(pacificDay(Date.parse('2026-11-15T07:59:00Z')), D - 1, 'PST: before 08:00 UTC it is still the 14th');
assert.equal(pacificDay(Date.parse('2026-11-15T08:00:00Z')), D);
assert.equal(pacificEndMs(D - 1), Date.parse('2026-11-15T08:00:00Z'), 'the 14th ends at 08:00 UTC (PST)');
assert.equal(pacificEndMs(Math.floor(Date.parse('2026-07-01T00:00:00Z') / 864e5)), Date.parse('2026-07-02T07:00:00Z'), 'and at 07:00 UTC in summer (PDT)');
const pt = toPacificDays({
  [D]: {
    live: { a: { at: D * 864e5 + 3 * H, game: 'tango', mode: 'solo', n: 1, fin: { at: 1 } }, b: { at: D * 864e5 + 10 * H, game: 'tango', mode: 'solo', n: 1 } },
    local: { tango: { solo: { 1: 2 } } }, fin: { tango: { solo: 1 } },
    rooms: { R: { at: D * 864e5 + 2 * H, game: 'dudo' } },
    activos: { aaaaaaaaaa: 1, bbbbbbbbbb: 1 }, activosPt: { [D - 1]: { aaaaaaaaaa: 1 }, [D]: { bbbbbbbbbb: 2 } },
    entradas: { inicio: 2 }, entradasPt: { [D - 1]: { inicio: 1 }, [D]: { inicio: 1 } }, vistas: { inicio: 5 },
  },
  [D - 40]: { local: { zip: { solo: { 1: 3 } } } },
});
assert.deepEqual(pt[D - 1].local, { tango: { solo: { 1: 1 } } }, 'a game at 03:00 UTC is the day before, Pacific');
assert.deepEqual(pt[D - 1].fin, { tango: { solo: 1 } });
assert.deepEqual(pt[D].local, { tango: { solo: { 1: 1 } } });
assert.deepEqual(pt[D].fin, {}, 'the game at 10:00 UTC did not finish');
assert.ok(pt[D - 1].rooms.R, 'rooms by their moment');
assert.deepEqual(pt[D - 1].activos, { aaaaaaaaaa: 1 }, 'browsers by Pacific day once the counter exists');
assert.deepEqual(pt[D].activos, { bbbbbbbbbb: 2 });
assert.deepEqual(pt[D - 1].entradas, { inicio: 1 }, 'visits too');
assert.deepEqual(pt[D].vistas, { inicio: 5 }, 'a counter with no moment stays on its UTC day');
assert.deepEqual(pt[D - 40].local, { zip: { solo: { 1: 3 } } }, 'a day before live/ existed keeps its counters');
assert.equal(pt[D].activosPt, undefined);
console.log('panel/wbr: OK');
