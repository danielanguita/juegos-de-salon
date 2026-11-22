/**
 * The player's profile (lab flag `profile`, lab: #seccion-profile): one page with the player's card,
 * then three tabs, 🎖️ badges, 🏅 rankings and ⚙️ settings. Without a player it invites to sign in,
 * shows the badges this phone already earned and the rankings as /records/ does. /records/ stays
 * as it is meanwhile (the owner, 2026-11-21: «que coexistan por un tiempo»).
 *
 * What it reads is the player's own (`jugador.js`): their record in `jugadores/<jid>` (since when,
 * how many games of each), their Uno al día history, their cups and La Copa's podiums, and the
 * tables they are in. A badge earned once stays earned on this phone (`earned`'s `seen`), so a
 * first place lost this week keeps its badge.
 */
import { el } from '../assets/js/ui.js';
import { withIcon } from '../assets/js/game-icon.js';
import { getLang, langToggle, pickLang, COMMON } from '../assets/js/i18n.js';
import { SFX, soundToggle } from '../assets/js/sound.js';
import { ALL_GAMES, GAMES, SOLO_TABLES, FIRST_VARIANT_TABLES } from '../assets/js/games.js';
import { bloqueJugador, bloqueRanking, mmss, conBandera } from '../assets/js/ranking.js';
import { jugador, leerYo } from '../assets/js/jugador.js';
import { TODOTERRENO, UAD_PUNTOS, SIEMPRE, semana, medallero, limpiarNombre, esPin } from '../assets/js/records.js';
import { nombreOfensivo } from '../assets/js/name-guard.js';
import { flag } from '../assets/js/flags.js';
import { leer as leerDia, recorrer, fechaLocal } from '../assets/js/uno-al-dia.js';
import { readHours, readRun, readMarks } from '../assets/js/play-hours.js';
import { PARTIDAS_KEY } from '../assets/js/transport/stats.js';
import { firebaseConfig } from '../assets/js/firebase-config.js';
import { BADGES, GROUPS, earned, lastOnDay } from './badges.js';
import { TEXTS } from './texts.js';

const lang = getLang();
const T = TEXTS[lang] || TEXTS.es;
const RK = (COMMON[lang] || COMMON.es).rk;
const fmt = (s, v = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : `{${k}}`));
const tap = () => SFX.tap();
const num = x => new Intl.NumberFormat(lang).format(x);
const place = p => (Number.isInteger(p) ? (lang === 'en' ? `#${p}` : `${p}.º`) : T.noPlace);
const monthName = ms => new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(new Date(ms));
/** Monthly points began in October 2026 (D-412): the months before have no table. */
const FIRST_POINTS_MONTH = '2026-10';

/** The games a player can earn badges in: launched, not hidden. */
const CATALOGUE = ALL_GAMES.filter(g => g.available !== false && !g.labs && !g.oculto);
const gameOf = id => ALL_GAMES.find(g => g.id === id);
/** The table a game's best lives in: its solo table, its wins for a group game, or its own. */
function tableOf(id) {
  if (SOLO_TABLES[id]) return { t: SOLO_TABLES[id], wins: false };
  if (GAMES.some(g => g.id === id && g.jugadas)) return { t: `${id}_victorias`, wins: true };
  return { t: FIRST_VARIANT_TABLES[id] || id, wins: false };
}

/* ------------------------------------------------------------------ */
/* What this phone knows, and what the server adds                     */
/* ------------------------------------------------------------------ */

const SEEN = jid => `juegos-de-salon:profile-badges:${jid || 'guest'}`;
const readSeen = jid => { try { return JSON.parse(localStorage.getItem(SEEN(jid)) || '{}') || {}; } catch (_) { return {}; } };
const writeSeen = (jid, v) => { try { localStorage.setItem(SEEN(jid), JSON.stringify(v)); } catch (_) { /* not kept */ } };

/** The facts this phone holds without asking anyone (a guest's, and a player's first draw). */
function localFacts() {
  const d = leerDia();
  const hoy = fechaLocal();
  const r = recorrer(d.dias || {}, hoy, { regalos: d.regalos || [] });
  let played = [];
  try { played = JSON.parse(localStorage.getItem('juegos-de-salon:jugados') || '[]'); } catch (_) { played = []; }
  const ids = new Set(CATALOGUE.map(g => g.id));
  return {
    today: hoy, now: Date.now(),
    streak: r.racha, bestStreak: r.mejor,
    dailyDays: Object.fromEntries(Object.keys(d.dias || {}).map(f => [f, true])),
    hours: readHours(),
    bestRun: Number(readRun().best) || 0,
    marks: readMarks(),
    launches: Object.fromEntries(ALL_GAMES.filter(g => /^\d{4}-\d{2}-\d{2}$/.test(g.nuevoDesde || '')).map(g => [g.id, g.nuevoDesde])),
    plays: Number(localStorage.getItem(PARTIDAS_KEY)) || 0,
    gamesPlayed: Array.isArray(played) ? played.filter(id => ids.has(id)).length : 0,
    gamesTotal: CATALOGUE.length,
  };
}

/** Whether this page talks to the real database (the published site) or to the test one (D-138). */
const realDb = () => !/[?&](test|records=local)\b/.test(location.search) && !/^(localhost|127\.|192\.168\.|10\.|100\.)/.test(location.hostname);

/** How many of `cups` (`[{ code, p }]`) the player created: the cup's admin is their seat. */
async function hostedOf(cups) {
  if (!realDb() || !cups.length) return 0;
  const base = firebaseConfig.databaseURL;
  const admins = await Promise.all(cups.slice(0, 40).map(c => fetch(`${base}/torneos/${c.code}/meta/admin.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)));
  return cups.slice(0, 40).filter((c, i) => admins[i] === c.p).length;
}

/** How many cups the player won (`podios`, by pid) after being last on day 1: each won cup's day 1, read on the published site. */
async function climbsOf(podios, jid) {
  if (!realDb()) return 0;
  const won = Object.entries(podios || {}).flatMap(([code, c]) => (Number(c?.dias) || 2) > 1
    ? Object.entries(c?.p || {}).filter(([, x]) => x?.j === jid && x.l === 1).map(([pid]) => ({ code, pid })) : []).slice(-20);
  const base = firebaseConfig.databaseURL;
  const days = await Promise.all(won.map(w => fetch(`${base}/torneos/${w.code}/results/1.json`).then(r => (r.ok ? r.json() : null)).catch(() => null)));
  return won.filter((w, i) => days[i] && lastOnDay(days[i], w.pid)).length;
}

/** The player's facts: the phone's, plus their server record. Each read on its own: one failing leaves the rest. */
async function playerFacts(J, yo) {
  const f = localFacts();
  const [perfil, hist, cups, podios] = await Promise.all([
    J.perfil().catch(() => null), J.historialDia().catch(() => ({})), J.copas().catch(() => []), J.podios().catch(() => ({})),
  ]);
  // Uno al día from any phone: the server's days (by number) joined with this phone's (by date)
  const dias = { ...(leerDia().dias || {}) };
  for (const n of Object.keys(hist || {})) if (/^\d+$/.test(n)) dias[new Date(Number(n) * 86400000).toISOString().slice(0, 10)] ||= hist[n];
  const r = recorrer(dias, f.today, { regalos: leerDia().regalos || [] });
  f.streak = r.racha; f.bestStreak = r.mejor;
  f.dailyDays = Object.fromEntries(Object.keys(dias).map(d => [d, true]));
  const juegos = perfil?.juegos || {};
  f.byGame = Object.entries(juegos).map(([id, x]) => ({ id, n: Number(x?.n) || 0 })).filter(x => x.n > 0 && gameOf(x.id)).sort((a, b) => b.n - a.n);
  const ids = new Set(CATALOGUE.map(g => g.id));
  f.gamesPlayed = f.byGame.filter(x => ids.has(x.id)).length;
  f.plays = f.byGame.reduce((s, x) => s + x.n, 0);
  f.since = Number(perfil?.at) || 0;
  f.cups = cups.length;
  f.cupList = cups;
  const mine = medallero(podios).find(x => x.jid === yo.jid);
  f.medals = { gold: mine?.oro || 0, silver: mine?.plata || 0, bronze: mine?.bronce || 0 };
  f.podiums = Object.entries(podios || {}).flatMap(([code, c]) => Object.values(c?.p || {}).filter(x => x.j === yo.jid).map(x => ({ code, name: c.name, end: c.end || 0, l: x.l }))).sort((a, b) => b.end - a.end);
  // Finished months of Uno al día points: the player's place when on the podium
  const months = [];
  for (let m = FIRST_POINTS_MONTH; m < f.today.slice(0, 7); m = nextMonth(m)) months.push(m);
  f.months = (await Promise.all(months.map(async m => {
    try { const v = await J.tabla(UAD_PUNTOS, `s${m}`, { top: 3 }); const i = v.top.findIndex(x => x.jid === yo.jid); return { period: `s${m}`, place: i >= 0 ? v.top[i].puesto : null }; } catch (_) { return null; }
  }))).filter(Boolean);
  [f.hosted, f.climbs] = await Promise.all([hostedOf(cups).catch(() => 0), climbsOf(podios, yo.jid).catch(() => 0)]);
  return f;
}
const nextMonth = m => { const [y, mo] = m.split('-').map(Number); return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`; };

/** Places in the overall ranking and in each game's table, read a few at a time. Adds `firsts` and `allRounder` to `f`. */
async function ranksOf(J, f, onGame) {
  const sem = semana(Date.now());
  const read = async (t, p) => { try { return (await J.tabla(t, p, { top: 10 })).yo || null; } catch (_) { return null; } };
  const [ever, week] = await Promise.all([read(TODOTERRENO, SIEMPRE), read(TODOTERRENO, sem)]);
  f.allRounder = ever?.puesto ?? null;
  f.general = { ever: ever?.puesto ?? null, week: week?.puesto ?? null };
  let firsts = 0;
  const queue = [...(f.byGame || [])];
  const worker = async () => {
    for (let g = queue.shift(); g; g = queue.shift()) {
      const { t, wins } = tableOf(g.id);
      const [e, w] = await Promise.all([read(t, SIEMPRE), read(t, sem)]);
      if (e?.puesto === 1 || w?.puesto === 1) firsts++;
      onGame(g.id, { t, wins, ever: e, week: w });
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  f.firsts = firsts;
  return f;
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

function badgeEl(b) {
  const [name, desc] = b.secret && !b.got ? [T.secretName, T.secretDesc] : T.badges[b.id] || [b.id, ''];
  return el('div', { class: `pf-badge pf-badge--${b.tier}${b.got ? '' : ' pf-badge--locked'}${b.new ? ' pf-badge--new' : ''}`, 'data-badge': b.id },
    b.new ? el('span', { class: 'pf-new' }, T.isNew) : null,
    el('span', { class: 'pf-medal', 'aria-hidden': 'true' }, b.secret && !b.got ? '?' : b.icon),
    b.got && b.count > 1 ? el('span', { class: 'pf-times' }, `×${b.count}`) : null,
    el('span', { class: 'pf-name' }, name),
    el('span', { class: 'pf-desc' }, b.progress ? `${desc} · ${num(b.progress[0])} / ${num(b.progress[1])}` : desc),
    b.progress ? el('span', { class: 'pf-bar', 'aria-hidden': 'true' }, el('i', { style: `width:${Math.round(100 * b.progress[0] / b.progress[1])}%` })) : null);
}

function badgePanels(list, { only = null } = {}) {
  const title = { daily: T.groupDaily, cup: T.groupCup, games: T.groupGames };
  return GROUPS.map(g => {
    const all = list.filter(b => b.group === g && (!only || only(b)));
    if (!all.length) return null;
    const got = all.filter(b => b.got).length;
    return el('section', { class: 'panel pf-group', 'data-group': g },
      el('p', { class: 'lead pf-group-head' }, el('span', {}, title[g]), el('small', {}, fmt(T.groupOf, { n: got, total: all.length }))),
      el('div', { class: 'pf-grid' }, all.map(badgeEl)));
  });
}

function card(yo, f, list) {
  const got = list.filter(b => b.got).length;
  // The flag and the name are the player, as on every table (the owner, 2026-11-21: no initial in a circle)
  return el('section', { class: 'panel pf-card' },
    el('div', { class: 'pf-who' },
      el('div', {},
        el('p', { class: 'pf-player' }, conBandera(yo.co, yo.n)),
        el('p', { class: 'muted pf-since' }, [f.since ? fmt(T.since, { month: monthName(f.since) }) : null, fmt(T.badgesOf, { n: got, total: BADGES.length })].filter(Boolean).join(' · ')))),
    el('div', { class: 'pf-stats' },
      el('div', { class: 'pf-stat' }, el('b', {}, `🔥 ${num(f.streak || 0)}`), el('span', {}, T.statStreak)),
      el('div', { class: 'pf-stat' }, el('b', {}, num(f.plays || 0)), el('span', {}, T.statPlays)),
      el('div', { class: 'pf-stat' }, el('b', {}, `🏆 ${num(f.medals?.gold || 0)}`), el('span', {}, T.statCups))));
}

/** The 🏅 tab: the overall ranking with the player's places, their games, Uno al día's month and their cups. */
function rankingsTab(J, f) {
  const box = el('div', { class: 'pf-tab' });
  // The overall ranking, with the player's three places on top of its table
  const pos = (v, label) => el('div', { class: 'pf-place' }, el('i', { 'aria-hidden': 'true' }), el('b', {}, v), el('span', {}, label));
  const places = el('div', { class: 'pf-places' }, pos('…', T.week), pos('…', T.ever), pos('…', T.friends));
  // Each place with some joy (the owner, 2026-11-22): a medal and its metal on the podium, 🔥 in the top 10, a pop when it arrives
  const setPlace = (i, p) => {
    const box = places.children[i], ok = Number.isInteger(p) && p >= 1;
    const tier = !ok ? '' : p === 1 ? 'gold' : p === 2 ? 'silver' : p === 3 ? 'bronze' : p <= 10 ? 'top' : 'rest';
    box.className = `pf-place${tier ? ` pf-place--${tier}` : ''}`;
    box.children[0].textContent = { gold: '🥇', silver: '🥈', bronze: '🥉', top: '🔥', rest: '🎲' }[tier] || '';
    box.children[1].textContent = ok ? place(p) : T.noPlace;
  };
  const general = bloqueRanking({ juego: TODOTERRENO, titulo: T.general, hint: RK.allRounderHint, alTocar: tap });
  general.insertBefore(places, general.querySelector('.rk-seg'));
  J.tablaAmigos(TODOTERRENO, SIEMPRE).then(rows => {
    const i = rows.findIndex(x => x.jid === leerYo()?.jid);
    setPlace(2, i >= 0 && rows.length > 1 ? rows[i].puesto : null);
  }).catch(() => setPlace(2, null));
  // The player's games, most played first: their best, their place ever and this week
  const games = el('section', { class: 'panel pf-games' }, el('p', { class: 'lead rk-titulo' }, T.yourGames));
  const rows = new Map();
  const list = el('div', { class: 'pf-game-list' });
  let open = null;
  const SHOWN = 6;
  if (!f.byGame?.length) games.append(el('p', { class: 'muted rk-centro' }, T.noGames));
  else {
    games.append(el('p', { class: 'muted rk-hint' }, T.yourGamesHint), list);
    f.byGame.forEach((g, i) => {
      const game = gameOf(g.id);
      const { t, wins } = tableOf(g.id);
      const best = el('span', { class: 'pf-game-sub' }, g.n === 1 ? T.playsOne : fmt(T.plays, { n: num(g.n) }));
      const where = el('span', { class: 'pf-game-place' }, '…');
      const slot = el('div', { class: 'pf-game-table' });
      const row = el('button', { type: 'button', class: 'pf-game', 'data-game': g.id, 'aria-expanded': 'false', hidden: i >= SHOWN,
        onClick: () => {
          tap();
          const was = open === g.id;
          if (open) { const o = rows.get(open); o.slot.replaceChildren(); o.row.setAttribute('aria-expanded', 'false'); }
          open = was ? null : g.id;
          if (!was) { slot.replaceChildren(bloqueRanking({ juego: t, titulo: null, hint: wins ? RK.winsHint : null, alTocar: tap })); row.setAttribute('aria-expanded', 'true'); }
        } },
      el('span', { class: 'pf-game-name' }, withIcon(game, pickLang(game.name, lang))), best, where);
      rows.set(g.id, { row, best, where, slot, n: g.n, wins });
      list.append(row, slot);
    });
    if (f.byGame.length > SHOWN) {
      const more = el('button', { type: 'button', class: 'btn btn--ghost btn--sm pf-more', onClick: () => { tap(); list.querySelectorAll('.pf-game[hidden]').forEach(b => { b.hidden = false; }); more.remove(); } }, fmt(T.moreGames, { n: f.byGame.length - SHOWN }));
      games.append(more);
    }
  }
  // Uno al día's month and the player's cups
  const month = bloqueRanking({ juego: UAD_PUNTOS, titulo: fmt(T.dailyMonth, { month: monthName(Date.now()) }), pestanas: ['mes', 'amigosMes'], alTocar: tap });
  const medal = l => ['🥇', '🥈', '🥉'][l - 1] || '🏆';
  const cups = el('section', { class: 'panel pf-cups' }, el('p', { class: 'lead rk-titulo' }, T.yourCups),
    f.podiums?.length
      ? el('div', { class: 'rk-lista' }, f.podiums.slice(0, 8).map(p => el('div', { class: 'rk-fila' },
        el('span', { class: 'rk-puesto' }, medal(p.l)), el('span', { class: 'rk-nombre' }, el('span', { class: 'rk-n' }, p.name || p.code)), el('span', {}), el('span', { class: 'rk-puntos' }, place(p.l)))))
      : el('p', { class: 'muted rk-centro' }, f.cups ? `${f.cups} 🏆` : T.noCups));
  const all = el('a', { class: 'btn btn--ghost', href: '../records/', onClick: tap }, T.allRankings);
  box.append(general, games, month, cups, all);
  return {
    box,
    /** A game's places arrived. */
    game(id, r) {
      const x = rows.get(id);
      if (!x) return;
      const b = r.ever;
      if (b) x.best.textContent = `${fmt(T.best, { score: x.wins ? num(b.s) : `${num(b.s)}${b.ms ? ` · ${mmss(b.ms)}` : ''}` })} · ${x.n === 1 ? T.playsOne : fmt(T.plays, { n: num(x.n) })}`;
      x.where.textContent = b ? place(b.puesto) : T.noPlace;
      if (r.week?.puesto) x.where.append(el('small', {}, fmt(T.placeWeek, { place: place(r.week.puesto) })));
    },
    general(g) {
      setPlace(0, g.week);
      setPlace(1, g.ever);
    },
  };
}

/** The ⚙️ tab: the account and the preferences (offline mode's ☁️ stays on the home page; writing to us and privacy are in the footer). */
/** An account error in the player's words: the rankings' own texts. */
const accountError = e => ({ 'pin-actual': RK.errCurrentPin, espera: RK.errWait, nombre: RK.errName, 'pin-forma': RK.errPin })[e?.code] || RK.errNet;
const pinInput = (id, label) => el('input', { id, class: 'rk-pin', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '4', autocomplete: 'off', 'aria-label': label });

/**
 * 👤 Your account (D-600): the name and the PIN, each with «Cambiar», which opens its small form under
 * the row, and «Salir de tu cuenta», which asks once. Both changes ask for the PIN. Signing in is the
 * guest's page (drawGuest); signing out redraws the page as a guest.
 */
// A rename redraws the page (the card and the bars show the new name): its «Listo» waits here for the new panel
let renamed = '';
function accountPanel(yo) {
  const forms = [];
  const row = (label, hint, value, form) => {
    const btn = el('button', { type: 'button', class: 'btn btn--ghost btn--sm pf-change', 'aria-expanded': 'false' }, T.change);
    const box = el('div', { class: 'pf-form', hidden: true }, form);
    forms.push({ btn, box });
    btn.addEventListener('click', () => {
      tap();
      const open = box.hidden;
      for (const f of forms) { f.box.hidden = true; f.btn.setAttribute('aria-expanded', 'false'); f.btn.textContent = T.change; }
      box.hidden = !open; btn.setAttribute('aria-expanded', String(open));
      // While its form is open, the row's button closes it
      btn.textContent = open ? T.cancel : T.change;
      if (open) box.querySelector('input')?.focus();
    });
    return el('div', { class: 'pf-account-item' },
      el('div', { class: 'pf-account-row' }, el('span', { class: 'txt' }, el('small', { class: 'pf-account-label' }, label), value, el('small', {}, hint)), btn), box);
  };
  const say = (p, cls, text) => { p.className = cls; p.textContent = text; };

  // The name: the new one and the PIN
  const name = el('input', { id: 'pf-new-name', maxlength: '20', autocomplete: 'nickname', 'aria-label': T.newName, value: yo.n });
  const namePin = pinInput('pf-name-pin', RK.currentPin);
  const nameMsg = el('p', { class: 'rk-error', role: 'alert' });
  const saveName = el('button', { type: 'button', class: 'btn btn--cyan btn--sm', id: 'pf-save-name' }, T.saveName);
  saveName.addEventListener('click', async () => {
    tap(); say(nameMsg, 'rk-error', '');
    const n = limpiarNombre(name.value);
    if (!n) return say(nameMsg, 'rk-error', RK.errName);
    if (n === leerYo()?.n) return say(nameMsg, 'rk-error', T.sameName);
    if (!esPin(namePin.value)) return say(nameMsg, 'rk-error', RK.errPin);
    saveName.disabled = true;
    try {
      // A new name on the public tables: the obvious insults are refused, as on sign-up (D-513); lab: #seccion-name-guard
      if (nombreOfensivo(n) && await flag('name-guard').catch(() => false)) { say(nameMsg, 'rk-error', RK.errNameBad); return; }
      renamed = fmt(T.nameSaved, { name: n });
      await (await jugador()).renombrar(namePin.value, n);
      namePin.value = '';
      say(nameMsg, 'rk-ok', renamed);
    } catch (e) { renamed = ''; say(nameMsg, 'rk-error', accountError(e)); }
    finally { saveName.disabled = false; }
  });
  namePin.addEventListener('keydown', e => { if (e.key === 'Enter') saveName.click(); });

  // The PIN: the current one and the new one
  const current = pinInput('pf-pin-current', RK.currentPin);
  const fresh = pinInput('pf-pin-new', RK.newPin);
  const pinMsg = el('p', { class: 'rk-error', role: 'alert' });
  const savePin = el('button', { type: 'button', class: 'btn btn--cyan btn--sm', id: 'pf-save-pin' }, T.savePin);
  savePin.addEventListener('click', async () => {
    tap(); say(pinMsg, 'rk-error', '');
    if (!esPin(current.value) || !esPin(fresh.value)) return say(pinMsg, 'rk-error', RK.errPin);
    savePin.disabled = true;
    try { await (await jugador()).cambiarPin(current.value, fresh.value); current.value = ''; fresh.value = ''; say(pinMsg, 'rk-ok', RK.pinChanged); }
    catch (e) { say(pinMsg, 'rk-error', accountError(e)); }
    finally { savePin.disabled = false; }
  });
  fresh.addEventListener('keydown', e => { if (e.key === 'Enter') savePin.click(); });

  // Signing out: asked once, as it leaves this phone without the player
  const ask = el('div', { class: 'pf-logout-ask', hidden: true },
    el('p', { class: 'muted' }, T.logoutAsk),
    el('div', { class: 'rk-botones' },
      el('button', { type: 'button', class: 'btn btn--yellow btn--sm', id: 'pf-logout-yes', onClick: async () => { tap(); (await jugador()).salir(); } }, RK.logout),
      el('button', { type: 'button', class: 'btn btn--ghost btn--sm', id: 'pf-logout-no', onClick: () => { tap(); ask.hidden = true; out.hidden = false; out.focus(); } }, T.cancel)));
  const out = el('button', { type: 'button', class: 'btn btn--ghost btn--sm pf-logout', id: 'pf-logout', onClick: () => { tap(); out.hidden = true; ask.hidden = false; } }, T.logout);

  const nameNow = el('b', { class: 'pf-name-now' }, conBandera(yo.co, yo.n));
  const done = renamed ? el('p', { class: 'rk-ok', role: 'status', id: 'pf-renamed' }, renamed) : null;
  renamed = '';
  return el('section', { class: 'panel pf-settings', id: 'pf-account' }, el('p', { class: 'lead rk-titulo' }, T.account),
    row(T.nameRow, T.nameHint, nameNow, [
      el('label', { class: 'rk-campo' }, el('span', {}, T.newName), name),
      el('label', { class: 'rk-campo' }, el('span', {}, RK.currentPin), namePin),
      saveName, nameMsg,
    ]),
    done,
    row(T.pinRow, T.pinRowHint, el('b', { class: 'pf-pin-dots', 'aria-hidden': 'true' }, '••••'), [
      el('label', { class: 'rk-campo' }, el('span', {}, RK.currentPin), current),
      el('label', { class: 'rk-campo' }, el('span', {}, RK.newPin), fresh),
      savePin, pinMsg,
    ]),
    out, ask);
}

function settingsTab(yo) {
  const row = (label, hint, control) => el('div', { class: 'toggle-row' }, el('span', { class: 'txt' }, el('b', {}, label), hint ? el('small', {}, hint) : null), control);
  const prefs = el('section', { class: 'panel pf-settings' }, el('p', { class: 'lead rk-titulo' }, T.prefs),
    row(T.language, null, langToggle()), row(T.sound, null, soundToggle()));
  const notices = el('div', {});
  import('../assets/js/uno-al-dia-avisos.js').then(m => {
    const draw = () => { const b = m.bloque({ lang, alTocar: tap, redibujar: draw }); notices.replaceChildren(...(b ? [b] : [])); };
    draw();
  }).catch(() => {});
  return el('div', { class: 'pf-tab' }, accountPanel(yo), prefs, notices);
}

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

const TABS = ['badges', 'rankings', 'settings'];

/** Draws the page in `root` for whoever is on this phone. Returns when the first draw is on screen. */
export async function drawProfile(root, { sub }) {
  const J = await jugador();
  let turn = 0;
  const draw = async () => {
    const mine = ++turn;
    const yo = leerYo();
    sub.textContent = yo ? T.pageSub : T.guestSub;
    if (!yo) return drawGuest(root);
    // First what the phone knows, at once; then the server's facts and places, as they arrive
    const tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'badges';
    let f = { ...localFacts(), byGame: [] };
    const paint = () => {
      const r = earned(f, readSeen(yo.jid));
      writeSeen(yo.jid, r.seen);
      return r.list;
    };
    const badgesBox = el('div', { class: 'pf-tab' });
    const cardSlot = el('div', {});
    const seg = el('div', { class: 'seg pf-tabs', role: 'tablist' }, TABS.map(id => el('button', {
      type: 'button', role: 'tab', 'data-tab': id, onClick: () => { tap(); show(id); },
    }, T[`tab${id[0].toUpperCase()}${id.slice(1)}`])));
    const panes = { badges: badgesBox, rankings: el('div', {}), settings: settingsTab(yo) };
    function show(id) {
      seg.querySelectorAll('button').forEach(b => { const on = b.dataset.tab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      for (const k of TABS) panes[k].hidden = k !== id;
      history.replaceState(null, '', `#${id}`);
    }
    const repaint = list => { cardSlot.replaceChildren(card(yo, f, list)); badgesBox.replaceChildren(...badgePanels(list).filter(Boolean)); };
    repaint(paint());
    root.replaceChildren(cardSlot, seg, panes.badges, panes.rankings, panes.settings);
    show(tab);
    try { f = { ...f, ...(await playerFacts(J, yo)) }; } catch (_) { /* offline: the phone's facts stay */ }
    if (mine !== turn) return;
    repaint(paint());
    const rk = rankingsTab(J, f);
    panes.rankings.replaceChildren(rk.box);
    await ranksOf(J, f, (id, r) => rk.game(id, r)).catch(() => {});
    if (mine !== turn) return;
    if (f.general) rk.general(f.general);
    repaint(paint());
  };
  J.escuchar(() => draw());
  await draw();
  window.__profile = { redraw: draw };
}

function drawGuest(root) {
  const r = earned(localFacts(), readSeen(null));
  writeSeen(null, r.seen);
  // The badges this phone could earn without a name: Uno al día's streaks and hours, and the games played
  const local = new Set(['streak-10', 'streak-30', 'month-full', 'early-bird', 'explorer', 'plays-100', 'obsession', 'premiere', 'regular', 'weekends', 'mondays',
    'night-owl', 'tuesday-13', 'fiestas', 'halloween', 'xmas', 'new-year']);
  const list = r.list.filter(b => local.has(b.id) && (b.got || !b.secret));
  root.replaceChildren(
    bloqueJugador({ abierto: true, destacado: true, alTocar: tap }),
    el('section', { class: 'panel pf-group' },
      el('p', { class: 'lead pf-group-head' }, el('span', {}, T.guestBadges), el('small', {}, fmt(T.groupOf, { n: list.filter(b => b.got).length, total: list.length }))),
      el('div', { class: 'pf-grid' }, list.map(badgeEl)),
      el('p', { class: 'muted rk-hint pf-note' }, T.guestBadgesNote)),
    bloqueRanking({ juego: TODOTERRENO, titulo: T.general, hint: RK.allRounderHint, alTocar: tap }),
    bloqueRanking({ juego: UAD_PUNTOS, titulo: fmt(T.dailyMonth, { month: monthName(Date.now()) }), pestanas: ['mes', 'amigosMes'], alTocar: tap }),
    el('a', { class: 'btn btn--ghost', href: '../records/', onClick: tap }, T.allRankings));
}

