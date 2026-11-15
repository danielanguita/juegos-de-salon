// The WBR's weeks and highlights: node public/panel/wbr.test.mjs (the trend itself: tools/reports/weekly-data.test.mjs)
import assert from 'node:assert/strict';
import { closedWeek, weekOf, isoDay, highlights, trendStart } from './wbr.js';

const now = Date.parse('2026-11-15T12:00:00Z');
const w = closedWeek(now);
assert.deepEqual([isoDay(w.from), isoDay(w.to)], ['2026-11-08', '2026-11-14']);
assert.deepEqual(weekOf('2026-11-07', now), { from: w.from - 7, to: w.to - 7 }, 'a Saturday names its week');
assert.deepEqual(weekOf('2026-11-03', now), { from: w.from - 7, to: w.to - 7 }, 'any day names the week holding it');
assert.deepEqual(weekOf('2026-11-15', now), w, 'a week not closed yet falls back to the closed one');
assert.deepEqual(weekOf('nonsense', now), w);
assert.equal(isoDay(trendStart(w)), '2026-09-01', 'two months back, from the first');
const h = highlights({ metricas: [{ valores: [574, 494], cambio: 16 }], juegos: [{ juego: 'Flap', valores: [186], nuevo: 'Nov 9, 2026' }, { juego: 'Shinobi', valores: [176] }] });
assert.equal(h[0], 'Games finished rose 16% (574 vs. 494).');
assert.match(h[1], /Flap \(186 games\), then Shinobi \(176\)/);
assert.match(h[2], /Flap \(out Nov 9\)/);
console.log('panel/wbr: OK');
