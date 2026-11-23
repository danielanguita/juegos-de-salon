/**
 * The duels' screens (lab flag rivals, duels.js): a duel as a card and as a row, the profile's
 * section, the new-duel sheet (also the ⚔️ of a ranking's row, with the rival and the game chosen)
 * and the ⚔️ itself. The styles are in `assets/css/duels.css`, which `cargarCss()` adds once.
 */
import { el } from './ui.js';
import { gameIcon } from './game-icon.js';
import { getLang } from './i18n.js';
import { SUELTOS } from './games.js';
import { jugador, leerYo } from './jugador.js';
import { estado, record, nemesis, sugeridos, linkRonda, FORMATOS } from './duels.js';
import { TEXTS } from './duels-texts.js';

const lang = getLang();
export const T = TEXTS[lang] || TEXTS.es;
export const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
const RAIZ = new URL('../../', import.meta.url).href;

/** The games a duel can be played in: the ones with their own page that take a seed. */
export const DUEL_GAMES = SUELTOS.filter(g => !g.labs && g.available !== false && !g.oculto && !g.bodega);
export const duelGame = id => DUEL_GAMES.find(g => g.id === id) || null;
const nombreJuego = g => g.name?.[lang] || g.name?.es || g.id;

export function cargarCss() {
  if (document.querySelector('link[data-duels]')) return;
  document.head.append(el('link', { rel: 'stylesheet', href: `${RAIZ}assets/css/duels.css`, 'data-duels': '' }));
}

/** Where round i of duel d is played. */
export function hrefRonda(d, i) {
  const g = duelGame(d.g);
  return g ? linkRonda(d, i, RAIZ, g.path) : `${RAIZ}duels/`;
}
export const hrefDuelos = () => `${RAIZ}duels/`;

const puntos = e => e.rondas.map(r => el('span', { class: `dl-punto${r ? ` ${r}` : ''}`, 'aria-hidden': 'true' }));
const marcador = e => `${e.puntos[0]}–${e.puntos[1]}`;
const titulo = d => { const g = duelGame(d.g); return `${g ? `${g.emoji} ${nombreJuego(g)}` : d.g} · ${T[d.f] || ''}`; };

/** A duel as a card (the profile's row). */
export function duelCard(d, me, { alTocar = () => {} } = {}) {
  const e = estado(d, me);
  const turno = e.turno >= 0;
  return el('div', { class: `panel dl-card${turno ? ' turno' : ''}`, 'data-duel': d.id },
    el('p', { class: 'dl-card-g' }, titulo(d)),
    el('div', { class: 'dl-vs' }, el('span', {}, leerYo()?.n || ''), el('b', { class: 'dl-marcador' }, marcador(e)), el('span', {}, e.rivalN)),
    el('div', { class: 'dl-puntos' }, puntos(e)),
    turno
      ? el('a', { class: 'btn btn--yellow btn--sm', href: hrefRonda(d, e.turno), onClick: alTocar }, T.yourTurn)
      : el('p', { class: 'dl-espera' }, e.termino ? T[e.gano === 1 ? 'won' : e.gano === -1 ? 'lost' : 'draw'] : fmt(T.waitingFor, { n: e.rivalN })));
}

/** A duel as a row (the all-duels page). */
export function fila(d, me, { alTocar = () => {} } = {}) {
  const e = estado(d, me);
  const fin = e.termino ? (e.gano === 1 ? 'w' : e.gano === -1 ? 'l' : 't') : null;
  const h = Math.max(1, Math.ceil((e.vence - Date.now()) / 3600000));
  return el('div', { class: 'dl-row', 'data-duel': d.id },
    el('div', { class: 'dl-row-txt' },
      el('b', {}, e.rivalN),
      el('small', {}, titulo(d) + (e.termino ? '' : ` · ${fmt(T.hoursLeft, { h })}`)),
      el('div', { class: 'dl-row-sc' }, el('span', { class: 'dl-puntos' }, puntos(e)), marcador(e))),
    fin ? el('span', { class: `dl-fin ${fin}` }, T[{ w: 'won', l: 'lost', t: 'draw' }[fin]])
      : e.turno >= 0 ? el('a', { class: 'btn btn--yellow btn--sm', href: hrefRonda(d, e.turno), onClick: alTocar }, T.play)
        : el('span', { class: 'dl-espera' }, fmt(T.waitingFor, { n: e.rivalN })));
}

/** The pills of a player's record. */
export function pildoras(lista, me) {
  const r = record(lista, me);
  if (r.g + r.p === 0) return [el('span', { class: 'dl-pill' }, T.pillNone)];
  return [el('span', { class: 'dl-pill' }, fmt(T.pillRecord, { g: r.g, p: r.p, pct: r.pct })), r.racha > 1 ? el('span', { class: 'dl-pill' }, fmt(T.pillStreak, { n: r.racha })) : null].filter(Boolean);
}

/** Open duels first (mine to play, then waiting), newest first within each. */
export function ordenar(lista, me) {
  const peso = d => { const e = estado(d, me); return e.turno >= 0 ? 0 : !e.termino ? 1 : 2; };
  return [...lista].sort((a, b) => peso(a) - peso(b) || b.at - a.at);
}

/** The profile's section: the pills, ＋ New duel and the open duels as cards, See all, the nemesis. */
export async function seccionPerfil({ alTocar = () => {} } = {}) {
  cargarCss();
  const yo = leerYo();
  const caja = el('section', { class: 'dl-seccion', id: 'duelos' });
  if (!yo) return caja;
  const J = await jugador();
  const D = await J.duelos();
  const pintar = lista => {
    const abiertos = ordenar(lista, yo.jid).filter(d => !estado(d, yo.jid).termino);
    const turnos = abiertos.filter(d => estado(d, yo.jid).turno >= 0).length;
    const nem = nemesis(lista, yo.jid);
    caja.replaceChildren(...[
      el('div', { class: 'dl-pills' }, pildoras(lista, yo.jid)),
      el('div', { class: 'dl-head' },
        el('p', { class: 'lead' }, T.yourDuels, turnos ? el('small', {}, ` ${fmt(T.yourTurnN, { n: turnos })}`) : null),
        el('a', { href: hrefDuelos(), onClick: alTocar }, T.seeAll)),
      el('div', { class: 'dl-fila' },
        el('button', { type: 'button', class: 'panel dl-nuevo', id: 'dl-nuevo', onClick: () => { alTocar(); abrirNuevo({ lista, alTocar }); } },
          el('span', { 'aria-hidden': 'true' }, '⚔️'), el('span', {}, T.newDuel), el('span', { class: 'dl-mas', 'aria-hidden': 'true' }, '+')),
        abiertos.map(d => duelCard(d, yo.jid, { alTocar }))),
      nem ? el('div', { class: 'panel dl-nemesis' },
        el('b', {}, `${T.nemesis} · ${nem.n} ${nem.g}–${nem.p}`),
        el('button', { type: 'button', class: 'btn btn--cyan btn--sm', onClick: () => { alTocar(); abrirNuevo({ lista, rival: { jid: nem.jid, n: nem.n }, alTocar }); } }, T.rematch)) : null].filter(Boolean));
  };
  pintar([]);
  D.mios().then(pintar).catch(() => {});
  return caja;
}

/**
 * The new-duel sheet. With `rival` and `juego` (a ranking's ⚔️) it opens centred, those chosen;
 * from the profile it slides up with the rivals to choose from (those played, then cup friends,
 * then a search by name).
 */
export async function abrirNuevo({ rival = null, juego = null, lista = null, alTocar = () => {} } = {}) {
  cargarCss();
  const yo = leerYo();
  const J = await jugador();
  const D = await J.duelos();
  const centrado = !!rival && !!juego;
  let elegido = rival, formato = 'bo3', g = juego && duelGame(juego) ? juego : DUEL_GAMES[0]?.id;
  const cerrarBtn = el('button', { type: 'button', class: 'icon-btn', 'aria-label': '✕' }, '✕');
  const cuerpo = el('div', { class: 'stack dl-sheet' });
  const panel = el('div', { class: 'hoja', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dl-titulo' },
    centrado ? null : el('div', { class: 'hoja-asa' }),
    el('div', { class: 'hoja-cabeza' }, el(centrado ? 'h2' : 'h3', { id: 'dl-titulo', class: centrado ? 'display display--md' : '' }, `⚔️ ${centrado ? T.challenge : T.newDuel}`), cerrarBtn),
    cuerpo);
  const capa = el('div', { class: `hoja-capa${centrado ? ' portada-ventana' : ''}`, id: 'dl-hoja' }, el('div', { class: 'hoja-fondo' }), panel);
  const cerrar = () => { capa.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') cerrar(); };
  // Only a tap on the dimmed page closes it: a tap inside may redraw what it hit
  capa.addEventListener('click', e => { if (e.target === capa || e.target.classList.contains('hoja-fondo')) cerrar(); });
  cerrarBtn.addEventListener('click', () => { alTocar(); cerrar(); });
  document.addEventListener('keydown', onKey);
  document.body.append(capa);

  if (!yo) {
    const { bloqueJugador } = await import('./ranking.js');
    cuerpo.replaceChildren(el('p', { class: 'dl-nota' }, T.signIn), bloqueJugador({ abierto: true, destacado: true, alTocar }));
    J.escuchar(() => { if (leerYo() && capa.isConnected) { cerrar(); abrirNuevo({ rival, juego, lista, alTocar }); } });
    return capa;
  }
  const misDuelos = lista || await D.mios().catch(() => []);
  let candidatos = sugeridos(misDuelos, yo.jid, J.amigos());
  if (rival && !candidatos.some(c => c.jid === rival.jid)) candidatos = [rival, ...candidatos];
  const error = el('p', { class: 'rk-error', 'aria-live': 'polite' });
  const chips = (opciones, actual, poner) => el('div', { class: 'dl-chips' }, opciones.map(([v, txt]) => el('button', {
    type: 'button', class: `chip-btn${v === actual ? ' on' : ''}`, 'data-v': v, onClick: () => { alTocar(); poner(v); pintar(); },
  }, txt)));
  let buscando = false;
  const pintar = () => {
    const quien = elegido?.n || '';
    const rivales = centrado ? el('div', { class: 'dl-versus' },
      el('div', {}, el('b', {}, yo.n)), el('span', { class: 'display display--md' }, 'VS'), el('div', {}, el('b', {}, rival.n)))
      : el('div', { class: 'stack' },
        el('p', { class: 'dl-label' }, T.rival),
        el('div', { class: 'dl-chips', id: 'dl-rivales' },
          candidatos.slice(0, 8).map(c => el('button', { type: 'button', class: `chip-btn${elegido?.jid === c.jid ? ' on' : ''}`, 'data-jid': c.jid, onClick: () => { alTocar(); elegido = c; pintar(); } }, c.n)),
          el('button', { type: 'button', class: `chip-btn${buscando ? ' on' : ''}`, id: 'dl-buscar', onClick: () => { alTocar(); buscando = !buscando; pintar(); } }, `🔍 ${T.search}`)),
        buscando ? buscador() : null);
    const juegos = centrado ? null : el('div', { class: 'stack' },
      el('p', { class: 'dl-label' }, T.game),
      el('div', { class: 'dl-juegos' }, DUEL_GAMES.map(x => el('button', {
        type: 'button', class: `dl-juego${x.id === g ? ' on' : ''}`, 'data-g': x.id, onClick: () => { alTocar(); g = x.id; pintar(); },
      }, el('span', { class: 'dl-ic', 'aria-hidden': 'true' }, gameIcon(x)), el('span', {}, nombreJuego(x))))));
    cuerpo.replaceChildren(...[
      rivales,
      el('div', { class: 'stack' }, el('p', { class: 'dl-label' }, T.format), chips(Object.keys(FORMATOS).map(f => [f, T[f]]), formato, v => { formato = v; })),
      juegos,
      el('p', { class: 'dl-nota' }, T.how),
      error,
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-enviar', disabled: !elegido, onClick: enviar }, elegido ? fmt(T.send, { n: quien }) : T.pickRival)].filter(Boolean));
  };
  const buscador = () => {
    const inp = el('input', { type: 'text', id: 'dl-nombre', maxlength: '20', autocomplete: 'off', 'aria-label': T.searchLabel, placeholder: T.searchLabel });
    const res = el('div', { class: 'dl-chips' });
    const ir = async () => {
      alTocar();
      const r = await D.buscar(inp.value).catch(() => []);
      res.replaceChildren(...(r.length ? r.map(c => el('button', { type: 'button', class: 'chip-btn', 'data-jid': c.jid, onClick: () => {
        alTocar(); elegido = c; buscando = false; if (!candidatos.some(x => x.jid === c.jid)) candidatos = [c, ...candidatos]; pintar();
      } }, c.n)) : [el('p', { class: 'dl-nota' }, T.noOne)]));
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ir(); });
    setTimeout(() => inp.focus(), 0);
    return el('div', { class: 'stack' }, el('div', { class: 'dl-buscar' }, inp, el('button', { type: 'button', class: 'btn btn--cyan btn--sm', onClick: ir }, T.searchGo)), res);
  };
  async function enviar() {
    if (!elegido) return;
    alTocar();
    error.textContent = '';
    try {
      const d = await D.retar({ b: elegido.jid, bn: elegido.n, g, f: formato });
      cuerpo.replaceChildren(
        el('p', { class: 'notice' }, fmt(T.sent, { n: elegido.n })),
        el('a', { class: 'btn btn--yellow', id: 'dl-jugar', href: hrefRonda(d, 0), onClick: alTocar }, fmt(T.playRound, { i: 1 })));
    } catch (_) { error.textContent = T.errSend; }
  }
  pintar();
  return capa;
}

/**
 * The ⚔️ on every other player's row of a ranking whose table is a duel game: added to the rows
 * as they are drawn (a MutationObserver on `root`), it opens the challenge for that player and game.
 */
export function retosEnRankings(root, { alTocar = () => {} } = {}) {
  cargarCss();
  const poner = () => {
    const yo = leerYo()?.jid;
    root.querySelectorAll('.rk-ranking[data-tabla]').forEach(caja => {
      const id = String(caja.dataset.tabla).split('_')[0];
      if (!duelGame(id)) return;
      caja.querySelectorAll('.rk-fila[data-jid]:not(.dl-con)').forEach(f => {
        if (!f.dataset.jid || f.dataset.jid === yo || f.classList.contains('yo')) return;
        const n = f.querySelector('.rk-n')?.textContent?.replace(/^\p{RI}{2}\s*/u, '').trim() || '?';
        f.classList.add('dl-con');
        f.append(el('button', {
          type: 'button', class: 'dl-retar', 'aria-label': fmt(T.challengeRow, { n }),
          onClick: e => { e.stopPropagation(); alTocar(); abrirNuevo({ rival: { jid: f.dataset.jid, n }, juego: id, alTocar }); },
        }, '⚔️'));
      });
    });
  };
  poner();
  new MutationObserver(poner).observe(root, { childList: true, subtree: true });
}
