/**
 * Duels (lab flag `rivals`, lab: #seccion-rivals): one player challenges another to a few rounds of
 * one game. Both play the same levels (each round has its seed, as La Copa's days do, D-97), each at
 * their own pace, and the duel lasts three days at most (the owner, 2026-11-22).
 *
 *   duelos/<did>                { a, b, an, bn, f, g, sd: { 0: CODE, … }, gr?: { 0: game, … }, at }
 *                               a challenged b to game `g` in format `f` (bo3, bo5, pts), written once;
 *                               a custom duel's `gr` names each round's game (round i plays gr[i] or g)
 *   duelos/<did>/e/<jid>/<i>    when jid began round i, once: a round begun and left counts as 0
 *   duelos/<did>/r/<jid>/<i>    { s, ms, at }: jid's result in round i, once, after it began
 *   jugadorDuelos/<jid>/<did>   when the duel was created: each player's list of duels
 *   duelosRecientes/<did>       when the duel was created: the public list of recent duels (/duels/)
 *
 * Everything that decides a duel is pure (`estado`), so a phone and the tests agree on it: no job
 * closes a duel, its clock does. The rules (firebase/database.rules.json) take a write only from a
 * phone seated as that player (jugadorSeats, D-464) and only before the three days are up.
 */
import { esJid, claveNombre, S_MAX, MS_MAX } from './records.js';

export const DURACION = 3 * 86400000;
export const FORMATOS = { bo3: 3, bo5: 5, pts: 3 };
export const DID = /^[a-z0-9]{10}$/;
export const esDid = d => typeof d === 'string' && DID.test(d);
const HORA = { '.sv': 'timestamp' };

/** A round's seed: a code as La Copa's (5 letters without I and O, cup/code.js), which the game pages take. */
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const randomSeed = (rand = Math.random) => Array.from({ length: 5 }, () => LETRAS[Math.floor(rand() * LETRAS.length)]).join('');

export function nuevoDid(rand = Math.random) {
  const L = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < 10; i++) s += L[Math.floor(rand() * L.length)];
  return s;
}

export const rondas = d => FORMATOS[d?.f] || 3;
/** The game round i is played in: the custom duel's own for that round, or the duel's. */
export const roundGame = (d, i) => d?.gr?.[i] || d?.g;
export const otro = (d, jid) => (d.a === jid ? d.b : d.a);
export const nombreDe = (d, jid) => (d.a === jid ? d.an : d.bn);

/** Who won a round between two results (null: not played): 1 a, -1 b, 0 a tie. */
export function ganaRonda(ra, rb) {
  const sa = ra?.s ?? 0, sb = rb?.s ?? 0;
  if (sa !== sb) return sa > sb ? 1 : -1;
  const ja = ra && !ra.dejada, jb = rb && !rb.dejada;
  if (!ja || !jb) return ja ? 1 : jb ? -1 : 0;
  if (ra.ms !== rb.ms) return ra.ms < rb.ms ? 1 : -1;
  return 0;
}

/**
 * Everything a screen shows about a duel at time `t`, from `me`'s side:
 * { n, mias, suyas, puntos: [yo, el], rondas: ['w'|'l'|'t'|null…], fin, termino, gano: 1|-1|0|null,
 *   turno: the next round I can play or -1, vence }
 * A round counts once both played it, or once the duel is over (an unplayed round is a 0).
 * Best of N ends early when someone holds more than half; points, when both played every round.
 */
export function estado(d, me, t = Date.now()) {
  const n = rondas(d), el = otro(d, me);
  const res = jid => Array.from({ length: n }, (_, i) => d.r?.[jid]?.[i] || (d.e?.[jid]?.[i] != null ? { s: 0, ms: MS_MAX, dejada: true } : null));
  const mias = res(me), suyas = res(el);
  const vence = (d.at || 0) + DURACION;
  const vencido = t >= vence;
  const cuenta = i => vencido || (mias[i] && suyas[i]);
  const rondasV = mias.map((m, i) => (cuenta(i) ? ({ 1: 'w', '-1': 'l', 0: 't' })[ganaRonda(m, suyas[i])] : null));
  const w = rondasV.filter(x => x === 'w').length, l = rondasV.filter(x => x === 'l').length;
  const suma = a => a.reduce((x, r) => x + (r?.s || 0), 0);
  const msSuma = a => a.reduce((x, r) => x + (r && !r.dejada ? r.ms : 0), 0);
  const todas = mias.every(Boolean) && suyas.every(Boolean);
  let termino, gano = null, puntos;
  if (d.f === 'pts') {
    puntos = [suma(mias), suma(suyas)];
    termino = vencido || todas;
    if (termino) gano = puntos[0] !== puntos[1] ? Math.sign(puntos[0] - puntos[1]) : Math.sign(msSuma(suyas) - msSuma(mias));
  } else {
    puntos = [w, l];
    const mitad = Math.floor(n / 2) + 1;
    termino = vencido || todas || w >= mitad || l >= mitad;
    if (termino) gano = Math.sign(w - l);
  }
  const turno = termino ? -1 : mias.findIndex(x => !x);
  return { n, mias, suyas, puntos, rondas: rondasV, termino, gano, turno, vence, rival: el, rivalN: nombreDe(d, el) };
}

/** Where a player stands over their finished duels: { g, p, e, pct, racha }. */
export function record(lista, me, t = Date.now()) {
  const fin = lista.map(d => ({ d, e: estado(d, me, t) })).filter(x => x.e.termino).sort((x, y) => y.d.at - x.d.at);
  const g = fin.filter(x => x.e.gano === 1).length, p = fin.filter(x => x.e.gano === -1).length, e = fin.length - g - p;
  let racha = 0;
  for (const x of fin) { if (x.e.gano === 1) racha++; else break; }
  return { g, p, e, pct: g + p ? Math.round((100 * g) / (g + p)) : null, racha };
}

/** The rival I lose to most (at least two duels and more lost than won), or null. */
export function nemesis(lista, me, t = Date.now()) {
  const por = {};
  for (const d of lista) {
    const e = estado(d, me, t);
    if (!e.termino) continue;
    const x = (por[e.rival] ||= { jid: e.rival, n: e.rivalN, g: 0, p: 0 });
    if (e.gano === 1) x.g++; else if (e.gano === -1) x.p++;
  }
  return Object.values(por).filter(x => x.g + x.p >= 2 && x.p > x.g).sort((a, b) => b.p - b.g - (a.p - a.g))[0] || null;
}

/** The game page of a duel's round: the game's own page with the round's seed. */
export function linkRonda(d, i, raiz, path) {
  // `path` is the page of round i's game (roundGame)
  return `${raiz}${path}?seed=${d.sd[i]}&duel=${d.id}&round=${i}`;
}

/**
 * The duels of a player, on a store (jugador-firebase.js or the test one): `yo()` is this phone's
 * player. Reads are public; writes need this phone seated as the player.
 */
export function crearDuelos({ almacen, yo, now = () => Date.now(), rand = Math.random }) {
  const leer = async did => { const d = await almacen.get(`duelos/${did}`); return d ? { id: did, ...d } : null; };
  return {
    leer,
    /** My duels, newest first. */
    async mios(jid = yo()?.jid) {
      if (!esJid(jid)) return [];
      const idx = (await almacen.get(`jugadorDuelos/${jid}`)) || {};
      const ids = Object.entries(idx).sort((a, b) => b[1] - a[1]).slice(0, 60).map(([k]) => k).filter(esDid);
      return (await Promise.all(ids.map(leer))).filter(Boolean);
    },
    /** The newest duels of everyone (the /duels/ page's list), newest first. */
    async recientes(n = 12) {
      const idx = (await almacen.recientes?.('duelosRecientes', n)) || {};
      const ids = Object.entries(idx).sort((a, b) => b[1] - a[1]).map(([k]) => k).filter(esDid);
      return (await Promise.all(ids.map(leer))).filter(Boolean);
    },
    /** Challenge `b` (a jid) to `g` in format `f`. Returns the duel. */
    async retar({ b, bn, g, f, gr = null }) {
      const me = yo();
      if (!me || !esJid(b) || b === me.jid || !FORMATOS[f]) throw Object.assign(new Error('duelo'), { code: 'duelo' });
      const id = nuevoDid(rand);
      const sd = Array.from({ length: FORMATOS[f] }, () => randomSeed(rand));
      const d = { a: me.jid, b, an: me.n, bn: String(bn || '').slice(0, 20) || '?', f, g, sd, at: HORA };
      // A custom duel: each round's game, only when they are not all the same
      if (Array.isArray(gr) && gr.length === sd.length && gr.some(x => x !== g)) d.gr = gr;
      await almacen.update({ [`duelos/${id}`]: d, [`jugadorDuelos/${me.jid}/${id}`]: HORA, [`jugadorDuelos/${b}/${id}`]: HORA, [`duelosRecientes/${id}`]: HORA });
      return { id, ...d, at: now() };
    },
    /** I began round i: from now on, leaving it counts as a 0. */
    async empezar(did, i) {
      const me = yo();
      if (!me || !esDid(did)) return false;
      if (await almacen.get(`duelos/${did}/e/${me.jid}/${i}`)) return false;
      await almacen.update({ [`duelos/${did}/e/${me.jid}/${i}`]: HORA });
      return true;
    },
    /** My result in round i, once. */
    async anotar(did, i, { s, ms }) {
      const me = yo();
      if (!me || !esDid(did)) return false;
      const r = { s: Math.max(0, Math.min(S_MAX, Math.round(s) || 0)), ms: Math.max(0, Math.min(MS_MAX, Math.round(ms) || 0)), at: HORA };
      await almacen.update({ [`duelos/${did}/r/${me.jid}/${i}`]: r });
      return true;
    },
    /** Players by name (the exact name, as signing in finds it): [{ jid, n }]. */
    async buscar(nombre) {
      const clave = claveNombre(nombre);
      if (!clave) return [];
      const ids = Object.keys((await almacen.get(`jugadorNombres/${clave}`)) || {}).filter(j => esJid(j) && j !== yo()?.jid);
      return (await Promise.all(ids.slice(0, 8).map(async jid => ({ jid, n: await almacen.get(`jugadores/${jid}/n`) })))).filter(x => x.n);
    },
  };
}

/**
 * Who to suggest as a rival (the owner: anyone can be challenged, those already played come first):
 * the rivals of my duels, newest first, then the friends of my cups, without repeats or me.
 */
export function sugeridos(lista, me, amigos = {}) {
  const out = [], visto = new Set([me]);
  const poner = (jid, n) => { if (esJid(jid) && !visto.has(jid) && n) { visto.add(jid); out.push({ jid, n }); } };
  for (const d of [...lista].sort((x, y) => y.at - x.at)) poner(otro(d, me), nombreDe(d, otro(d, me)));
  for (const [jid, n] of Object.entries(amigos)) poner(jid, n);
  return out;
}
