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
  const r = semana({ days, feedback: { a: { at: w.from * DAY + 1000 }, b: { at: 0 } } }, now);
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

test('the trend: five weeks and three months, versions merged, lab plays out, n/a before launch', () => {
  const w = semanaCerrada(Date.parse('2026-11-15T12:00:00Z'));
  const days = {
    [w.from]: { local: { tango: { solo: { 1: 5 } }, letras: { solo: { 1: 2 } }, 'toque-y-fama': { solo: { 1: 1 } }, aletazo: { solo: { 1: 9 } }, 'no-publico': { solo: { 1: 50 } } }, activos: { aaaaaaaaaa: 1 } },
    [w.from - 7]: { local: { tango: { solo: { 1: 4 } }, aletazo: { solo: { 1: 7 } } } },
  };
  const t = tendencia({ days, flags: { aletazo: { state: 'all', at: (w.from + 1) * DAY } } }, w);
  assert.equal(t.columnas.length, 8);
  assert.match(t.columnas[5], /partial/);
  assert.equal(baseGame('letras'), 'toque-y-fama');
  const por = Object.fromEntries(t.juegos.map(g => [g.juego, g]));
  assert.ok(!Object.keys(por).some(k => /no-publico/.test(k)), 'a game outside ALL_GAMES is a lab game');
  assert.equal(t.juegos.find(g => /Flap/.test(g.juego)), undefined, 'played only on its launch-week Sunday, before the flag');
  const bc = t.juegos.find(g => /Bulls and Cows/.test(g.juego));
  assert.equal(bc.valores[0], 3, 'Word and plain read as one');
  const tango = t.juegos.find(g => /Tango/.test(g.juego));
  assert.deepEqual([tango.valores[0], tango.valores[1], tango.cambio], [5, 4, 25]);
  assert.equal(tango.valores[2], null, 'n/a before the game was first seen');
  assert.equal(t.metricas.find(m => m.nombre === 'Active browsers').valores[1], null, 'n/a before the counter existed');
});

console.log(`reports/weekly-data: ${n} tests OK`);
