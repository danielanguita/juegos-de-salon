// The weekly report's numbers (D-352): node tools/reports/weekly-data.test.mjs
import assert from 'node:assert/strict';
import { semanaCerrada, diaSemana, fechaDia, versionesDeLaSemana, semana, nombreJuego, mensajeEn, tendencia, baseGame } from './weekly-data.mjs';
import { htmlDelInforme } from './weekly-html.mjs';

const DAY = 864e5;
let n = 0;
const test = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`✗ ${name}`); throw e; } };

test('the closed week: Sunday to Saturday, the one that ended before today', () => {
  const dom = Date.parse('2026-10-18T12:00:00Z'); // a Sunday
  const w = semanaCerrada(dom);
  assert.equal(diaSemana(w.from), 0);
  assert.equal(diaSemana(w.to), 6);
  assert.equal(fechaDia(w.from), 'Oct 11, 2026');
  assert.equal(fechaDia(w.to), 'Oct 17, 2026');
  assert.deepEqual(semanaCerrada(Date.parse('2026-10-17T23:00:00Z')), { from: w.from - 7, to: w.to - 7 }, 'on Saturday the week is not over yet');
});

test("the week's versions from CHANGELOG.md, with what each one changed", () => {
  const md = '# Changelog\n\n## 0.178.0 — 2026-10-18\n- **Not this week.**\n\n## 0.177.4 — 2026-10-17\n- **The panel, by domain.** More.\n- **Another thing:** x\n\n## 0.170.0 — 2026-10-01\n- **Old.**\n';
  const w = semanaCerrada(Date.parse('2026-10-18T12:00:00Z'));
  assert.deepEqual(versionesDeLaSemana(md, w), [{ v: '0.177.4', fecha: '2026-10-17', cambios: ['The panel, by domain', 'Another thing'] }]);
});

test('the numbers of the week against the one before', () => {
  const now = Date.parse('2026-10-18T12:00:00Z');
  const w = semanaCerrada(now);
  const days = {
    [w.from]: { local: { ahorcado: { solo: { 1: 4 } } }, fin: { ahorcado: { solo: 3 } }, entradas: { inicio: 10 }, juegan: { inicio: 4 }, activos: { aaaaaaaaaa: 2, bbbbbbbbbb: 1 }, comparte: { app: 2 } },
    [w.from - 7]: { local: { ahorcado: { solo: { 1: 2 } } }, fin: { ahorcado: { solo: 1 } }, entradas: { inicio: 5 } },
  };
  const r = semana({ days, feedback: { a: { at: w.from * DAY + 12 * 3600e3 }, b: { at: 0 } } }, now);
  const t = Object.fromEntries(r.titular.map(f => [f.nombre, f]));
  assert.deepEqual([t['Games finished (main metric)'].ahora, t['Games finished (main metric)'].antes, t['Games finished (main metric)'].cambio], [3, 1, 200]);
  assert.equal(t.Visits.cambio, 100);
  assert.equal(t['Active browsers in the week'].ahora, 2);
  assert.equal(r.trafico.juegan, 40);
  assert.equal(r.eventos.reportes, 1);
  assert.equal(r.porDia.length, 7);
  assert.match(r.individual.top[0].juego, /Hangman/);
  assert.equal(r.desde, 'Oct 11, 2026');
});

test("games by their English name, also La Copa's", () => {
  assert.match(nombreJuego('ahorcado'), /Hangman/);
  assert.match(nombreJuego('pintaminas:hard'), /· hard$/);
  assert.equal(nombreJuego('no-existe'), 'no-existe');
});

test('the page: Spanish load failures read in English, and it renders', () => {
  assert.equal(mensajeEn('módulo que no cargó (el de la página)'), "module that did not load (the page's own)");
  assert.equal(mensajeEn('TypeError: x'), 'TypeError: x');
  const html = htmlDelInforme(semana({}, Date.parse('2026-10-18T12:00:00Z')));
  assert.match(html, /Weekly report/);
  assert.match(html, /No versions released this week/);
});

test('the trend: five weeks and three months, games finished, versions merged, lab plays out, n/a before launch', () => {
  const w = semanaCerrada(Date.parse('2026-11-15T12:00:00Z'));
  const days = {
    [w.from]: { local: { tango: { solo: { 1: 5 } }, letras: { solo: { 1: 2 } }, 'toque-y-fama': { solo: { 1: 1 } }, aletazo: { solo: { 1: 9 } }, 'no-publico': { solo: { 1: 50 } }, generala: { solo: { 1: 8 } } }, activos: { aaaaaaaaaa: 1 },
      fin: { tango: { solo: 3 }, letras: { solo: 2 }, 'toque-y-fama': { solo: 1 }, aletazo: { solo: 9 }, 'no-publico': { solo: 50 } } },
    [w.from - 7]: { local: { tango: { solo: { 1: 4 } }, aletazo: { solo: { 1: 7 } } }, fin: { tango: { solo: 4 }, aletazo: { solo: 7 } } },
  };
  const t = tendencia({ days, flags: { aletazo: { state: 'all', at: (w.from + 1) * DAY } } }, w);
  assert.equal(t.columnas.length, 8);
  assert.equal(t.columnas[0], 'Nov 8–14');
  assert.equal(t.columnas[5], 'Nov*');
  assert.equal(t.columnas[6], 'Oct');
  assert.equal(t.leyenda, '* Partial: the month up to Nov 14.');
  assert.equal(baseGame('letras'), 'toque-y-fama');
  const por = Object.fromEntries(t.juegos.map(g => [g.juego, g]));
  assert.ok(!Object.keys(por).some(k => /no-publico/.test(k)), 'a game outside ALL_GAMES is a lab game');
  assert.equal(t.juegos.find(g => /Flap/.test(g.juego)), undefined, 'played only on its launch-week Sunday, before the flag');
  const bc = t.juegos.find(g => /Bulls and Cows/.test(g.juego));
  assert.equal(bc.valores[0], 3, 'Word and plain read as one');
  const tango = t.juegos.find(g => /Tango/.test(g.juego));
  assert.deepEqual([tango.valores[0], tango.valores[1], tango.cambio], [3, 4, -25], 'games finished, not started (5 started)');
  assert.equal(t.juegos.find(g => /Generala/.test(g.juego)), undefined, 'started 8 times, none finished: not in the top 10');
  assert.equal(tango.valores[2], null, 'n/a before the game was first seen');
  assert.equal(t.metricas.find(m => m.nombre === 'Active browsers').valores[1], null, 'n/a before the counter existed');
  assert.equal(t.metricas.find(m => m.nombre === 'Daily active browsers (average)').valores[0], 1);
  assert.equal(t.metricas.find(m => m.nombre === 'Games started per active browser').valores[0], 75, 'all 75 games started (as in the headline) by 1 active browser');
});

test('the panel: the week in progress first, partial, every comparison still on the closed week', () => {
  const w = semanaCerrada(Date.parse('2026-11-15T12:00:00Z'));
  const actual = { from: w.to + 1, to: w.to + 4 };
  const days = {
    [actual.from]: { local: { tango: { solo: { 1: 2 } }, zip: { solo: { 1: 30 } } }, fin: { tango: { solo: 2 }, zip: { solo: 30 } } },
    [w.from]: { local: { tango: { solo: { 1: 5 } } }, fin: { tango: { solo: 5 } } },
    [w.from - 7]: { local: { tango: { solo: { 1: 4 } } }, fin: { tango: { solo: 4 } } },
  };
  const t = tendencia({ days }, w, { actual });
  assert.equal(t.cerrada, 1);
  assert.equal(t.columnas.length, 9);
  assert.equal(t.columnas[0], 'Nov 15–18*');
  assert.equal(t.columnas[3], 'Oct 25–31');
  assert.equal(tendencia({}, semanaCerrada(Date.parse('2026-10-05T12:00:00Z'))).columnas[0], 'Sep 27–Oct 3', 'a week across two months names both');
  assert.equal(t.leyenda, '* Partial: the week so far (to Nov 18) and the month up to Nov 14.');
  const tango = t.juegos.find(g => /Tango/.test(g.juego));
  assert.deepEqual([tango.valores[0], tango.valores[1], tango.valores[2], tango.cambio], [2, 5, 4, 25]);
  assert.equal(t.juegos.length, 1, 'the top 10 is the closed week\'s, not the partial one\'s');
  assert.deepEqual(t.metricas.find(m => m.nombre === 'Games started').valores.slice(0, 3), [32, 5, 4]);
  assert.equal(t.metricas.find(m => m.nombre === 'Games started').cambio, 25);
  assert.deepEqual(t.totales.valores.slice(0, 3), [32, 5, 4], 'every public game, Zip too');
  assert.equal(t.totales.cambio, 25);
  assert.deepEqual(t.totales.top10.slice(0, 3), [6.3, 100, 100], 'the closed week\'s ten, 2 of 32 in the partial week');
});

test('active browsers by game: real from the counter (D-590), an estimate before it, months the average of their weeks', () => {
  const w = semanaCerrada(Date.parse('2026-11-15T12:00:00Z'));
  const days = {
    [w.from]: { activos: { aaaaaaaaaa: 2, bbbbbbbbbb: 2, cccccccccc: 1 }, local: { tango: { solo: { 1: 3 } }, zip: { solo: { 1: 1 } } }, fin: { tango: { solo: 3 }, zip: { solo: 1 } },
      jugadores: { tango: { aaaaaaaaaa: 2, bbbbbbbbbb: 2, cccccccccc: 1 }, zip: { aaaaaaaaaa: 2 }, 'no-publico': { cccccccccc: 2 }, generala: { aaaaaaaaaa: 1, bbbbbbbbbb: 1 } } },
    [w.from + 2]: { jugadores: { tango: { aaaaaaaaaa: 2 } } },
    [w.from - 7]: { activos: { aaaaaaaaaa: 2, bbbbbbbbbb: 2, dddddddddd: 1 }, local: { tango: { solo: { 1: 3 } }, zip: { solo: { 1: 1 } } }, fin: { tango: { solo: 3 }, zip: { solo: 1 } } },
  };
  const t = tendencia({ days }, w), u = t.usuariosJuego;
  assert.deepEqual(u.filas.map(f => f.juego.replace(/^\S+ /, '')), ['Tango', 'Zip'], 'by the closed week, most first; a lab game out');
  const tango = u.filas[0];
  assert.deepEqual(tango.valores.slice(0, 2), [2, 2], 'real: 2 distinct browsers; the week before, 2 that played × 3/4 of the games finished');
  assert.equal(tango.valores[2], null, 'no browsers measured yet');
  assert.equal(tango.cambio, null, 'real against an estimate is not compared');
  assert.deepEqual(u.filas[1].valores.slice(0, 2), [1, 1]);
  assert.deepEqual(u.estimado.slice(0, 3), [false, true, false]);
  assert.equal(tango.valores[5], 2, 'November so far: the average of its full weeks (Nov 1–7 and Nov 8–14)');
  assert.equal(u.estimado[5], true, 'a month with an estimated week is an estimate');
  assert.equal(u.desdeReal, 'Nov 8, 2026');
  // Started (1 or 2) as well: Tango 3, Generala 2 that nobody finished
  const emp = Object.fromEntries(t.usuariosEmpiezan.filas.map(f => [f.juego.replace(/^\S+ /, ''), f.valores[0]]));
  assert.deepEqual(emp, { Tango: 3, Generala: 2, Zip: 1 });
  assert.deepEqual(t.sinTerminar.map(g => [g.juego.replace(/^\S+ /, ''), g.empiezan]), [['Generala', 2]], 'started by 2 browsers, finished by none: flagged');
});

console.log(`reports/weekly-data: ${n} tests OK`);
