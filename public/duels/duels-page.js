/**
 * All of a player's duels (lab flag rivals, assets/js/duels.js): ⚔️ New duel, then the open ones in
 * two tabs (my turn, waiting) and the finished ones under them. A player with no duel yet gets the
 * new-duel sheet open on arrival. Without a player, the sign-in card.
 */
import { el } from '../assets/js/ui.js';
import { SFX } from '../assets/js/sound.js';
import { jugador, leerYo } from '../assets/js/jugador.js';
import { bloqueJugador } from '../assets/js/ranking.js';
import { estado, record } from '../assets/js/duels.js';
import { T, fmt, fila, ordenar, abrirNuevo } from '../assets/js/duels-ui.js';

export { T };
const tap = () => SFX.tap();

export async function drawDuels(root, { sub }) {
  const J = await jugador();
  let turn = 0, tab = 'turn', abierta = false; // the new-duel sheet opens on its own once, for a first-timer
  const draw = async () => {
    const mine = ++turn;
    const yo = leerYo();
    if (!yo) { sub.textContent = T.signIn; root.replaceChildren(bloqueJugador({ abierto: true, destacado: true, alTocar: tap })); return; }
    const nuevo = el('button', { type: 'button', class: 'btn btn--yellow', id: 'dl-nuevo', onClick: () => { tap(); abrirNuevo({ lista, alTocar: tap }); } }, `⚔️ ${T.newDuel}`);
    let lista = [], leida = false;
    root.replaceChildren(nuevo);
    try { lista = await (await J.duelos()).mios(); leida = true; } catch (_) { /* offline: nothing to show */ }
    if (mine !== turn) return;
    const r = record(lista, yo.jid);
    sub.textContent = r.g + r.p ? `${fmt(T.pageSub, { g: r.g, p: r.p })} · ${r.pct}%` : '';
    if (!lista.length) {
      root.replaceChildren(nuevo, el('p', { class: 'muted center' }, T.empty));
      // A first-timer (no duel, no record) came to start one: open the sheet once, not on every redraw
      if (leida && !abierta && !document.getElementById('dl-hoja')) { abierta = true; abrirNuevo({ lista, alTocar: tap }); }
      return;
    }
    const orden = ordenar(lista, yo.jid);
    const es = d => estado(d, yo.jid);
    const grupos = { turn: orden.filter(d => es(d).turno >= 0), waiting: orden.filter(d => !es(d).termino && es(d).turno < 0) };
    const hechos = orden.filter(d => es(d).termino);
    const listaAbierta = el('div', { id: 'dl-abiertos' });
    const seg = el('div', { class: 'rk-seg', role: 'tablist' }, ['turn', 'waiting'].map(k => el('button', {
      type: 'button', role: 'tab', 'data-t': k, onClick: () => { tap(); tab = k; marcar(); },
    }, `${T[k === 'turn' ? 'tabTurn' : 'tabWaiting']} ${grupos[k].length}`)));
    function marcar() {
      seg.querySelectorAll('button').forEach(b => { const on = b.dataset.t === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      listaAbierta.replaceChildren(...(grupos[tab].length ? grupos[tab].map(d => fila(d, yo.jid, { alTocar: tap })) : [el('p', { class: 'muted rk-centro' }, T.emptyTab)]));
    }
    if (!grupos.turn.length && grupos.waiting.length) tab = 'waiting';
    marcar();
    root.replaceChildren(...[nuevo,
      el('section', { class: 'panel' }, seg, listaAbierta),
      hechos.length ? el('section', { class: 'panel', id: 'dl-terminados' }, el('p', { class: 'lead' }, T.tabDone), hechos.map(d => fila(d, yo.jid, { alTocar: tap }))) : null].filter(Boolean));
  };
  J.escuchar(() => draw());
  await draw();
}
