/**
 * The Weekly Business Review (WBR): the trend the panel's 📋 WBR view and the weekly email show, one
 * account for both (D-352, D-560). The closed week and the four before it, this month so far and the
 * two months before; the headline metrics and the top 10 games. Pure, no DOM:
 * `node tools/reports/weekly-data.test.mjs` tests it.
 */
import { partidasDominio, finales, embudoSalas, usuarios, variacion } from './dominios.js';
import { trafico, DAY, pacificDay } from './aggregate.js';
import { resumenCopas } from './copas.js';
import { publicGameCheck } from './public-games.js';
import { gameById, isLocalMode, MODES } from '../assets/js/games.js';
import { juegosCopa } from '../cup/rules.js';


/**
 * Pacific time (D-561): the owner's weeks, months and days are Pacific dates, not UTC ones. A UTC
 * day's bucket (`stats/<env>/days/<utc day>`) holds the end of one Pacific date and the start of the
 * next, so `toPacificDays` moves what carries its moment to the Pacific date of that moment:
 * offline games (`live/`, with `local/` and `fin/` rebuilt from them), rooms (`rooms/`, by `at`) and,
 * since D-561, active browsers and visits (`activosPt/`, `entradasPt/`). What carries no moment stays
 * on its UTC day: games before `live/` existed (before 2026-10-04), browsers and visits before D-561,
 * and the other counters. Day numbers keep their form (days since 1970-01-01), now naming Pacific dates.
 */
export { pacificDay };

export function toPacificDays(days = {}) {
  const out = {};
  const caja = d => (out[d] ||= {});
  const movidos = new Map(), conActivosPt = new Set(), conEntradasPt = new Set();
  for (const [k, b] of Object.entries(days || {})) {
    const d = Number(k);
    if (!b || typeof b !== 'object' || !Number.isFinite(d)) continue;
    const todos = Object.entries(b.live || {}).filter(([, x]) => x && Number.isFinite(x.at));
    // live/ took a few weeks to cover every game: a day whose live/ does not match its counters keeps them
    const cuenta = x => isLocalMode(x?.mode) && !MODES[x.mode]?.torneo;
    let enLocal = 0;
    for (const modes of Object.values(b.local || {})) for (const [m, ns] of Object.entries(modes || {})) if (cuenta({ mode: m })) enLocal += Object.values(ns || {}).reduce((a, v) => a + (Number(v) || 0), 0);
    const live = Math.abs(todos.filter(([, x]) => cuenta(x)).length - enLocal) <= 1 ? todos : [];
    for (const [key, val] of Object.entries(b)) {
      if (key === 'live' || key === 'rooms' || key === 'activosPt' || key === 'entradasPt') continue;
      // local/ and fin/ come from live/ when the day has it (they match it one to one since 2026-10-04)
      if ((key === 'local' || key === 'fin') && live.length) continue;
      const c = caja(d);
      c[key] = key in c && typeof val === 'object' && val ? { ...c[key], ...val } : val;
    }
    for (const [id, x] of live) {
      const p = pacificDay(x.at);
      if (!movidos.has(p)) movidos.set(p, []);
      movidos.get(p).push(x);
      (caja(p).live ||= {})[id] = x;
    }
    if (!live.length && b.live) Object.assign(caja(d).live ||= {}, b.live);
    for (const [code, r] of Object.entries(b.rooms || {})) (caja(r && Number.isFinite(r.at) ? pacificDay(r.at) : d).rooms ||= {})[code] = r;
    for (const [p, ids] of Object.entries(b.activosPt || {})) { conActivosPt.add(Number(p)); Object.assign(caja(Number(p)).activosPt ||= {}, ids); }
    for (const [p, pags] of Object.entries(b.entradasPt || {})) {
      conEntradasPt.add(Number(p));
      const e = (caja(Number(p)).entradasPt ||= {});
      for (const [pg, v] of Object.entries(pags || {})) e[pg] = (e[pg] || 0) + (Number(v) || 0);
    }
  }
  for (const [p, xs] of movidos) {
    // Added to what a day kept of its own counters (a day whose live/ did not match, at the edge)
    const c = out[p], local = structuredClone(c.local || {}), fin = structuredClone(c.fin || {});
    for (const x of xs) {
      const m = x.mode || 'solo', n = String(Math.max(1, Number(x.n) || 1));
      ((local[x.game] ||= {})[m] ||= {})[n] = (local[x.game][m][n] || 0) + 1;
      if (x.fin) (fin[x.game] ||= {})[m] = (fin[x.game][m] || 0) + 1;
    }
    c.local = local; c.fin = fin;
  }
  // From the day the Pacific counters exist, they are the day's browsers and visits
  for (const p of conActivosPt) out[p].activos = out[p].activosPt;
  for (const p of conEntradasPt) out[p].entradas = out[p].entradasPt;
  for (const c of Object.values(out)) { delete c.activosPt; delete c.entradasPt; }
  return out;
}

/** The moment a Pacific date ends (its next midnight, Pacific time), in ms: 07:00 or 08:00 UTC. */
export function pacificEndMs(d) {
  let t = (d + 1) * DAY + 7 * 3600e3;
  while (pacificDay(t) <= d) t += 3600e3;
  return t;
}

/** The first Pacific date whose browsers and visits are by Pacific day (D-561), or null. */
export function pacificCountersSince(days = {}) {
  let min = Infinity;
  for (const b of Object.values(days || {})) for (const p of Object.keys(b?.activosPt || {})) min = Math.min(min, Number(p));
  return Number.isFinite(min) ? min : null;
}

/** A UTC day number as "Nov 8, 2026". */
export const dayLabel = d => new Date(d * DAY).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
const fechaDia = dayLabel;
const COPA = juegosCopa('en');
/** A game's English name with its emoji, from the registry or from La Copa's games. */
export function gameName(id) {
  const g = gameById(id);
  if (g) return `${g.emoji || ''} ${g.name?.en || g.name?.es || id}`.trim();
  const c = COPA[id];
  return c ? `${c.emoji} ${c.nombre}` : String(id);
}
const nombreJuego = gameName;

/** The first day the trend of week `w` reads: the first of the month two months before. */
export const trendStart = w => { const f = new Date(w.to * DAY); return Date.UTC(f.getUTCFullYear(), f.getUTCMonth() - 2, 1) / DAY; };

/** The UTC day number of the first day of the month `atras` months before the one holding day `d`. */
const inicioMes = (d, atras = 0) => { const f = new Date(d * DAY); return Date.UTC(f.getUTCFullYear(), f.getUTCMonth() - atras, 1) / DAY; };
const mesCorto = d => new Date(d * DAY).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' });
const rangoTxt = ({ from, to }) => `${fechaDia(from).replace(/, \d{4}$/, '')} – ${fechaDia(to).replace(/, \d{4}$/, '')}`;
/** A game's versions read as one (Bulls and Cows: Word is Bulls and Cows); its modes already split off by `:`. */
const VERSIONES = { letras: 'toque-y-fama', numero: 'toque-y-fama' };
export const baseGame = id => { const b = String(id).split(/:| · /)[0]; return VERSIONES[b] || b; };

/**
 * The trend the email's tables show: the closed week and the four before it, then this month so
 * far (partial), and the two months before. Every column is one range; `null` is "n/a": nothing
 * measured yet (the counter did not exist), or the game was not out yet. Games: the top 10 of the
 * closed week, every mode, version and La Copa's plays together, lab plays left out (a game outside
 * ALL_GAMES, or a play before the day its `flags/<id>` went to all).
 */
export function trend({ days = {}, torneos = {}, flags = {} } = {}, w) {
  const cols = [0, 1, 2, 3, 4].map(i => ({ from: w.from - 7 * i, to: w.to - 7 * i, titulo: rangoTxt({ from: w.from - 7 * i, to: w.to - 7 * i }), semana: true }));
  for (const atras of [0, 1, 2]) {
    const from = inicioMes(w.to, atras), to = atras ? inicioMes(w.to, atras - 1) - 1 : w.to;
    cols.push({ from, to, titulo: atras ? mesCorto(from) : `${mesCorto(from)} (to ${fechaDia(to).replace(/, \d{4}$/, '')}, partial)`, semana: false });
  }
  const dias = Object.keys(days).map(Number).filter(Number.isFinite);
  const primerDato = clave => Math.min(...dias.filter(d => days[d]?.[clave] && Object.keys(days[d][clave]).length), Infinity);
  const desde = { activos: primerDato('activos'), visitas: Math.min(primerDato('entradas'), primerDato('vistas')) };
  const medido = (col, k) => (desde[k] <= col.to ? undefined : null);
  const filas = cols.map(col => {
    const fin = pacificEndMs(col.to), rc = resumenCopas(torneos, col, fin, { dayFn: pacificDay }), pd = partidasDominio(days, col), f = finales(days, col);
    const salas = Object.values(embudoSalas(days, col)).reduce((k, g) => k + g.terminadas, 0);
    return {
      terminadas: f.terminadas + salas + rc.jugadas, empezadas: pd.grupo.total + pd.individual.total + rc.jugadas,
      ...(medido(col, 'activos') === null ? { activos: null, diarios: null, porActivo: null } : (u => ({
        activos: u.rango, diarios: u.diario,
        // Games started per browser active in the range: how much each one plays
        porActivo: u.rango ? Math.round(((pd.grupo.total + pd.individual.total + rc.jugadas) / u.rango) * 10) / 10 : null,
      }))(usuarios(days, col))),
      visitas: medido(col, 'visitas') === null ? null : trafico(days, col).visitas,
    };
  });
  const metricas = [['Games finished', 'terminadas'], ['Games started', 'empezadas'], ['Active browsers', 'activos'], ['Daily active browsers (average)', 'diarios'], ['Games per active browser', 'porActivo'], ['Visits', 'visitas']].map(([nombre, k]) => ({
    nombre, valores: filas.map(x => x[k]), decimales: k === 'porActivo', cambio: filas[0][k] === null || filas[1][k] === null || !filas[1][k] ? null : variacion(filas[0][k], filas[1][k]),
  }));

  // Games, day by day so a launch in the middle of a range cuts it on its day (lab plays already out of `days`)
  const esPublico = publicGameCheck(flags);
  const desdeCuando = {}, porCol = cols.map(() => ({}));
  const inicio = Math.min(...cols.map(c => c.from)), fin = w.to;
  for (let d = inicio; d <= fin; d++) {
    const pd = partidasDominio(days, { from: d, to: d }), rc = resumenCopas(torneos, { from: d, to: d }, pacificEndMs(d), { dayFn: pacificDay });
    const hoy = {};
    for (const [id, n] of [...Object.entries(pd.grupo.byGame), ...Object.entries(pd.individual.byGame), ...rc.porJuego.map(x => [x.id, x.jugadas])]) {
      if (!esPublico(id, d)) continue;
      const b = baseGame(id); hoy[b] = (hoy[b] || 0) + n;
    }
    for (const b in hoy) desdeCuando[b] ??= d;
    cols.forEach((c, i) => { if (d >= c.from && d <= c.to) for (const b in hoy) porCol[i][b] = (porCol[i][b] || 0) + hoy[b]; });
  }
  // Out since its launch day, or since its first play when no flag launched it
  const lanzadoEl = b => { for (let d = inicio; d <= fin; d++) if (esPublico(b, d)) return d; return Infinity; };
  const salio = b => (lanzadoEl(b) > inicio ? lanzadoEl(b) : desdeCuando[b]);
  const juegos = Object.entries(porCol[0]).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([b]) => {
    const valores = cols.map((c, i) => (salio(b) > c.to ? null : porCol[i][b] || 0));
    // A launch inside the week before makes a % that says nothing
    const cambio = valores[1] === null || salio(b) > cols[1].from ? null : variacion(valores[0], valores[1]);
    return { juego: nombreJuego(b), valores, cambio, nuevo: salio(b) > cols[1].to ? fechaDia(salio(b)) : null };
  });
  return { columnas: cols.map(c => c.titulo), metricas, juegos };
}

/** The last full week (Sunday to Saturday, Pacific dates) before `now`, as the weekly email reads it. */
export function closedWeek(now = Date.now()) {
  // The owner's clock (D-561): the week that ended before today's Pacific date
  let sat = pacificDay(now) - 1;
  while ((sat + 4) % 7 !== 6) sat--;
  return { from: sat - 6, to: sat };
}

/** The week a WBR address names (`#/wbr/2026-11-14`, its Saturday), or the closed week; never one not closed yet. */
export function weekOf(arg, now = Date.now()) {
  const last = closedWeek(now);
  const t = arg && /^\d{4}-\d{2}-\d{2}$/.test(arg) ? Math.floor(Date.parse(`${arg}T00:00:00Z`) / DAY) : NaN;
  if (!Number.isFinite(t)) return last;
  let sat = t;
  while ((sat + 4) % 7 !== 6) sat++;
  return sat > last.to ? last : { from: sat - 6, to: sat };
}

/** A UTC day number as `2026-11-14`, how a week goes in the address. */
export const isoDay = d => new Date(d * DAY).toISOString().slice(0, 10);

/** The WBR's highlights from its trend: what moved and what was played most. */
export function highlights(t) {
  const out = [];
  const [fin] = t.metricas;
  if (fin && fin.cambio !== null && fin.cambio !== 0) out.push(`Games finished ${fin.cambio > 0 ? 'rose' : 'fell'} ${Math.abs(fin.cambio)}% (${fin.valores[0].toLocaleString('en-US')} vs. ${fin.valores[1].toLocaleString('en-US')}).`);
  const [uno, dos] = t.juegos;
  if (uno) out.push(`Most played: ${uno.juego} (${uno.valores[0]} games)${dos ? `, then ${dos.juego} (${dos.valores[0]})` : ''}.`);
  const nuevos = t.juegos.filter(g => g.nuevo);
  if (nuevos.length) out.push(`New this week: ${nuevos.map(g => `${g.juego} (out ${g.nuevo.replace(/, \d{4}$/, '')})`).join(', ')}.`);
  return out;
}
