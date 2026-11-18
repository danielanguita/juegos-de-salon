/**
 * The home page's games as carousels, in place of the filters and the long list (lab flag
 * `home-carousels`, lab: #seccion-home-carousels). The top of the page stays as it is: bar, title,
 * tagline, the dice, La Copa and Uno al día. Under them, one row per way of choosing, each sliding
 * sideways: favourites (once one is marked), popular, new, with friends, quick, and one per type.
 * A game says its icon, its name and how long it takes (how many play too, when more than one can),
 * never a label: the row it is in already says it. A tap opens a sheet with what the game is, its
 * ranking and ▶ Jugar; the ⭐ lives there too.
 *
 * It reads the same games the list does (`PORTADA` without Toque y Fama: Palabra), so a game that
 * reaches the home page reaches a carousel (C-21). Only the home page loads this file.
 */
import { TIPOS, SOLO_TABLES, rangoJugadores, esNuevo, populares } from './games.js';
import { el } from './ui.js';
import { gameIcon } from './game-icon.js';
import { pickLang } from './i18n.js';
import { favoritos, alternarFavorito } from './favoritos.js';
import { loadCss } from './load-css.js';

/** What this phone last knew of the flag: the page hides the filters before any module arrives. */
export const HINT = 'juegos-de-salon:home-carousels';

/** A game is quick when its longest play is this many minutes or fewer. */
export const QUICK_MINUTES = 3;

export const TEXTS = {
  es: { friends: 'Con amigos', quick: 'Rápidos', details: 'Detalles', play: '▶ Jugar' },
  en: { friends: 'With friends', quick: 'Quick', details: 'Details', play: '▶ Play' },
  pt: { friends: 'Com amigos', quick: 'Rápidos', details: 'Detalhes', play: '▶ Jogar' },
};

/** The longest a game takes, in minutes; a game counted in another unit (La Copa's days) is never quick. */
export const maxMinutes = g => (g.durationUnit ? Infinity : Number(String(g.duration || '').split(/[^\d]+/).filter(Boolean).pop()) || Infinity);

/**
 * The rows, in order, each with the games it holds in the home page's own order; a row with no
 * game is left out, so none is ever empty. Pure, for node.
 */
export function shelves(games, { favs = [], top = populares(), isNew = esNuevo } = {}) {
  const open = games.filter(g => g.available && !g.torneo);
  const rows = [
    ['favorites', '⭐', g => favs.includes(g.id)],
    ['popular', '🔥', g => top.has(g.id)],
    ['new', '✨', g => isNew(g)],
    ['friends', '👥', g => rangoJugadores(g.players)[1] > 1],
    ['quick', '⚡', g => maxMinutes(g) <= QUICK_MINUTES],
    ...Object.entries(TIPOS).map(([id, t]) => [id, t.emoji, g => (g.tipos || []).includes(id)]),
  ];
  return rows.map(([id, emoji, test]) => ({ id, emoji, games: open.filter(test) })).filter(s => s.games.length);
}

/** The table a game's sheet shows: its wins when it is played in a room, else its solo scores (as /records/ does). */
export const rankingOf = g => (g.jugadas ? { table: `${g.id}_victorias`, wins: true } : { table: SOLO_TABLES[g.id] || g.id, wins: false });

const fmt = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => v[k] ?? `{${k}}`);

/**
 * Draws the carousels under the games list and hides the filters and the list's cards (the CSS
 * does, from `html.carousels`). Returns `{ remove() }`, which puts the page back as it was.
 */
export async function drawCarousels({ lang, T, games, tap = () => {}, doc = document }) {
  const t = TEXTS[lang] || TEXTS.es;
  const root = doc.documentElement;
  root.classList.add('carousels');
  // A filter kept in the link hid Uno al día's card: with no filters there is nothing to filter
  root.classList.remove('filtrado');
  await loadCss(new URL('../css/home-carousels.css', import.meta.url).href);

  const titles = { favorites: T.favorites, popular: T.filterPopular, new: T.filterNew, friends: t.friends, quick: t.quick };
  const titleOf = id => titles[id] || pickLang(TIPOS[id].name, lang);
  const unit = g => (g.durationUnit ? pickLang(g.durationUnit, lang) : T.minutes);

  const box = el('section', { class: 'shelves', id: 'shelves' });
  doc.getElementById('games').after(box);

  /* ---------------- the sheet ---------------- */
  let layer = null, before = null, pinned = null;
  const onKey = e => { if (e.key === 'Escape') close(); };
  // The page behind does not scroll while the sheet is open (as the share sheet does)
  const pin = () => {
    const b = doc.body, y = doc.defaultView?.scrollY || 0;
    pinned = { y, style: b.getAttribute('style') };
    Object.assign(b.style, { position: 'fixed', top: `-${y}px`, left: '0', right: '0', overflow: 'hidden' });
  };
  const unpin = () => {
    if (!pinned) return;
    if (pinned.style === null) doc.body.removeAttribute('style'); else doc.body.setAttribute('style', pinned.style);
    doc.defaultView?.scrollTo(0, pinned.y);
    pinned = null;
  };
  function close() {
    if (!layer) return;
    layer.remove(); layer = null;
    unpin();
    doc.removeEventListener('keydown', onKey);
    // The tile may have been drawn again meanwhile (a ⭐ marked): the one in its place takes the focus
    const again = before && box.querySelector(`[data-shelf="${before.shelf}"] [data-id="${before.id}"]`);
    (again || box.querySelector(`[data-id="${before?.id}"]`))?.focus?.();
  }

  function open(g, shelf, paths) {
    close();
    before = { id: g.id, shelf };
    const name = pickLang(g.name, lang);
    const [, max] = rangoJugadores(g.players);
    const favLabel = T.favorite.replace('{juego}', name);
    const fav = el('button', { type: 'button', class: 'icon-btn game-sheet-fav', id: 'btn-game-sheet-fav', 'aria-label': favLabel, title: favLabel });
    const paintFav = () => { const on = favoritos().includes(g.id); fav.textContent = on ? '★' : '☆'; fav.classList.toggle('on', on); fav.setAttribute('aria-pressed', String(on)); };
    fav.addEventListener('click', () => { tap(); alternarFavorito(g.id); paintFav(); doc.dispatchEvent(new CustomEvent('favoritos')); });
    paintFav();

    const details = el('div', { class: 'stack', id: 'game-sheet-details' },
      el('p', {}, pickLang(g.tagline, lang)),
      el('div', { class: 'chips' },
        el('span', { class: 'chip' }, `👥 ${g.players} ${max === 1 ? T.player : T.players}`),
        el('span', { class: 'chip' }, `⏱ ${g.duration} ${unit(g)}`),
        (g.tipos || []).filter(id => TIPOS[id]).map(id => el('span', { class: 'chip' }, `${TIPOS[id].emoji} ${pickLang(TIPOS[id].name, lang)}`))));
    const ranking = el('div', { id: 'game-sheet-ranking', hidden: true });
    const body = el('div', { class: 'game-sheet-body', role: 'tabpanel', id: 'game-sheet-panel' }, details, ranking);

    // The ranking is read the first time its tab is opened, never before: most taps only want to play
    let asked = false;
    const showRanking = () => {
      if (asked) return;
      asked = true;
      ranking.replaceChildren(el('p', { class: 'muted rk-centro' }, T.rk.loading));
      Promise.all([import('./ranking.js'), loadCss(new URL('../css/ranking.css', import.meta.url).href)]).then(([{ bloqueRanking }]) => {
        const { table, wins } = rankingOf(g);
        ranking.replaceChildren(bloqueRanking({ juego: table, titulo: fmt(wins ? T.rk.winsOf : T.rk.titleOf, { game: name }),
          hint: wins ? T.rk.winsHint : null, pestanas: ['semana', 'siempre'], alTocar: tap, rapido: true }));
      }).catch(() => { asked = false; ranking.replaceChildren(); });
    };
    const TABS = [['details', t.details], ['ranking', `🏅 ${T.rk.title}`]];
    let tab = 'details';
    const tabs = el('div', { class: 'hoja-pestanas', role: 'tablist', 'aria-label': name });
    const show = k => {
      tab = k;
      tabs.querySelectorAll('button').forEach(b => { const on = b.dataset.k === k; b.setAttribute('aria-selected', String(on)); b.classList.toggle('on', on); b.tabIndex = on ? 0 : -1; });
      body.setAttribute('aria-labelledby', `game-sheet-tab-${k}`);
      details.hidden = k !== 'details'; ranking.hidden = k !== 'ranking';
      if (k === 'ranking') showRanking();
    };
    for (const [k, label] of TABS) {
      const b = el('button', { type: 'button', role: 'tab', class: 'hoja-pestana', 'data-k': k, id: `game-sheet-tab-${k}`, 'aria-controls': 'game-sheet-panel' }, label);
      b.addEventListener('click', () => { if (k !== tab) { tap(); show(k); } });
      tabs.append(b);
    }
    tabs.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const k = tab === 'details' ? 'ranking' : 'details';
      show(k); tabs.querySelector(`[data-k="${k}"]`).focus();
    });

    const play = el('a', { class: 'btn btn--yellow', id: 'btn-game-sheet-play', href: g.path }, t.play);
    play.addEventListener('click', () => {
      tap();
      // Where the game came from, and the row it was in, for swiping between covers (as a card does)
      import('./transport/stats.js').then(m => m.markOrigin('card', play.href)).catch(() => {});
      import('./game-swipe.js').then(m => m.rememberList(paths)).catch(() => {});
    });

    const panel = el('div', { class: 'hoja game-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'game-sheet-title', id: 'game-sheet', 'data-id': g.id },
      el('div', { class: 'hoja-asa', 'aria-hidden': 'true' }),
      el('div', { class: 'hoja-cabeza' },
        el('span', { class: 'game-sheet-icon', 'aria-hidden': 'true' }, gameIcon(g, { size: 1 })),
        el('h2', { id: 'game-sheet-title' }, name),
        fav,
        el('button', { type: 'button', class: 'icon-btn', id: 'btn-game-sheet-close', 'aria-label': T.shareSheet.close, title: T.shareSheet.close, onClick: () => { tap(); close(); } }, '✕')),
      tabs, body, play);
    layer = el('div', { class: 'hoja-capa', id: 'game-sheet-layer' }, el('div', { class: 'hoja-fondo', onClick: close }), panel);
    doc.body.append(layer);
    show('details');
    pin();
    doc.addEventListener('keydown', onKey);
    play.focus();
  }

  /* ---------------- the rows ---------------- */
  function draw() {
    // Each row stays where the player left it when the rows are drawn again (a ⭐ marked)
    const at = Object.fromEntries([...box.querySelectorAll('.shelf-row')].map(r => [r.dataset.shelf, r.scrollLeft]));
    box.replaceChildren(...shelves(games, { favs: favoritos() }).map(s => {
      const paths = s.games.map(g => new URL(g.path, doc.baseURI).href);
      const row = el('div', { class: 'shelf-row', 'data-shelf': s.id, role: 'list' }, s.games.map(g => {
        const [, max] = rangoJugadores(g.players);
        return el('div', { role: 'listitem' }, el('button', { type: 'button', class: 'shelf-tile', 'data-id': g.id, 'aria-haspopup': 'dialog', onClick: () => { tap(); open(g, s.id, paths); } },
          el('span', { class: 'emoji', 'aria-hidden': 'true' }, gameIcon(g, { size: 1 })),
          el('span', { class: 'name' }, pickLang(g.name, lang)),
          el('span', { class: 'meta' },
            el('span', {}, `⏱ ${g.duration} ${unit(g)}`),
            max > 1 && el('span', {}, `👥 ${g.players}`, el('span', { class: 'unidad' }, ` ${T.players}`)))));
      }));
      const section = el('section', { class: 'shelf', 'aria-labelledby': `shelf-${s.id}` },
        el('h2', { class: 'display display--sm', id: `shelf-${s.id}` }, el('span', { 'aria-hidden': 'true' }, `${s.emoji} `), titleOf(s.id)), row);
      queueMicrotask(() => { if (at[s.id]) row.scrollLeft = at[s.id]; });
      return section;
    }));
  }
  draw();
  const onFav = () => draw();
  doc.addEventListener('favoritos', onFav);

  return {
    remove() {
      close();
      doc.removeEventListener('favoritos', onFav);
      box.remove();
      root.classList.remove('carousels');
    },
  };
}
