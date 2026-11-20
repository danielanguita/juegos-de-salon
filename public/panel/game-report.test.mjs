// 🎮 Games, the report by game: node public/panel/game-report.test.mjs
import assert from 'node:assert/strict';
import { gameReport, sparkline, reportStart, GAME_METRICS } from './game-report.js';
import { closedWeek, currentWeek } from './wbr.js';

const now = Date.parse('2026-11-18T20:00:00Z');
const w = closedWeek(now), actual = currentWeek(now);
assert.equal(reportStart(w), w.from - 49, 'eight weeks, the closed one included');
assert.equal(sparkline([0, 5, 10]), '▁▅█');
assert.equal(sparkline([0, 0]), '▁▁');
assert.equal(sparkline([null, 4]), ' █');

// The closed week: Liar's Dice 3 finished on one phone (4 started) and a room that ended; Hangman 1 solo.
// The week before: Liar's Dice 2. A lab game's plays never count; nor a game not in the registry.
const D = w.to;
const days = {
  [D]: {
    local: { dudo: { local: { 4: 4 } }, ahorcado: { solo: { 1: 2 } }, 'juego-nuevo': { solo: { 1: 5 } } },
    fin: { dudo: { local: 3 }, ahorcado: { solo: 1 }, 'juego-nuevo': { solo: 5 } },
    otra: { dudo: 2 },
    rooms: { ABCD: { game: 'dudo', at: 1, players: { A: 'a', B: 'b' }, end: { at: 2 } }, EFGH: { game: 'dudo', at: 1, players: { A: 'a' } } },
    jugadores: { dudo: { u1: 2 }, ahorcado: { u1: 2 } },
  },
  // The count by game covers the closed week from its Sunday
  [w.from]: { jugadores: { dudo: { u2: 1 } } },
  [D - 7]: { local: { dudo: { local: { 4: 2 } } }, fin: { dudo: { local: 2 } } },
  [actual.to]: { local: { ahorcado: { solo: { 1: 2 } } }, fin: { ahorcado: { solo: 3 } } },
};
const r = gameReport({ days }, w, { actual });
assert.equal(r.columnas.length, 9, 'the week in progress and eight closed ones');
assert.match(r.columnas[0], /\*$/, 'the week in progress is marked partial');
assert.equal(r.cerrada, 1);
assert.deepEqual(r.ranking.map(g => g.id), ['dudo', 'ahorcado'], 'by games finished in the closed week; nothing outside the registry');
const [dudo, ahorcado] = r.ranking;
assert.equal(dudo.terminadas, 4, 'one phone and a room that ended');
assert.equal(dudo.cambio, 100, 'against the week before');
assert.equal(dudo.share, 80);
assert.equal(dudo.puesto, 1);
assert.equal(ahorcado.parcial, 3, 'the week in progress, apart');
assert.equal(dudo.tendencia.length, 8);
assert.equal(dudo.tendencia.slice(-2), '▅█', 'oldest first, the closed week last');
const f = r.juegos.dudo.filas;
assert.equal(f.empezadas[1], 5, 'four on one phone and the room with a rival');
assert.equal(f.completan[1], 80);
assert.equal(r.juegos.ahorcado.filas.completan[0], null, 'more finished than started: n/a, not a capped 100%');
assert.equal(f.jugadores[1], 1, 'browsers that finished it');
assert.equal(f.empiezan[1], 2, 'and those that started it');
assert.equal(f.porJugador[1], 4);
assert.equal(f.otras[1], 2);
assert.equal(f.grupo[1], 3);
assert.equal(f.salas[1], 1);
assert.equal(f.salasCreadas[1], 2);
assert.equal(f.salasRival[1], 50);
assert.equal(f.jugadores[2], null, 'a week before the count by game is not measured');
assert.ok(!r.juegos.dudo.metricas.includes('copa'), 'a metric empty in every week is left out of the card');
assert.ok(r.juegos.dudo.metricas.every(m => GAME_METRICS.some(([k]) => k === m)));
assert.deepEqual(r.total.slice(0, 3), [3, 5, 2]);

// Without the week in progress the closed week is the first column
const sinActual = gameReport({ days }, w);
assert.equal(sinActual.cerrada, 0);
assert.equal(sinActual.ranking[0].parcial, null);
assert.deepEqual(gameReport({}, w).ranking, [], 'no play, no rows');
console.log('✓ game-report');
