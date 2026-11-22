/**
 * The window that celebrates a secret achievement (lab flag `profile`, the owner's request 2026-11-22): drawn
 * like Uno al día's month-end window (month-end.js, its comic card, rays and fireworks), with the
 * achievement's medal, its own message, how many secret ones the player has, and «Ver mis logros».
 * Three looks for the owner to pick (`style`): 'a' the medal hanging and swinging, 'b' a «?» medal that
 * flips to reveal it, 'c' the medal slapped on like a sticker under a rain of its own emoji.
 * `/profile/?achievement=demo` shows them with a picker; nothing is recorded.
 */
import { fireworks } from './month-end.js';

const ROOT = new URL('../../', import.meta.url);

/** The window's words (C-3); each secret achievement's message by its id. */
export const TEXTS = {
  es: {
    kicker: '🤫 Logro secreto desbloqueado', count: 'Llevas {n} de {total} logros secretos', go: '🎖️ Ver mis logros', later: 'Seguir jugando', close: 'Cerrar', burst: '¡SECRETO!',
    msg: {
      'night-owl': 'Tres juegos entre medianoche y las 4. Los búhos te saludan; mañana, café doble.',
      'triple-crown': 'Campeón de copa, campeón del mes y número 1 de un juego. Pocos llegan aquí arriba.',
      'one-year': 'Un año jugando con tu nombre. Gracias por quedarte: esta torta es tuya.',
      'tuesday-13': '13 juegos un martes 13. Ni te cases ni te embarques… pero jugar, todo lo que quieras.',
      fiestas: 'Jugaste un 18 de septiembre. ¡Viva Chile! Entre empanada y empanada, un juego.',
      halloween: 'Jugaste un 31 de octubre. ¿Dulce o truco? Un juego, claro.',
      xmas: 'Jugaste en Navidad. Entre regalos y pan de pascua, igual sacaste tiempo para un juego. ¡Jo, jo, jo!',
      'new-year': 'Jugaste el 1 de enero. Año nuevo, las mismas ganas de jugar.',
    },
  },
  en: {
    kicker: '🤫 Secret achievement unlocked', count: 'You have {n} of {total} secret achievements', go: '🎖️ See my achievements', later: 'Keep playing', close: 'Close', burst: 'SECRET!',
    msg: {
      'night-owl': 'Three games between midnight and 4 a.m. The owls salute you; tomorrow, double coffee.',
      'triple-crown': 'Cup champion, month champion and number 1 in a game. Few make it up here.',
      'one-year': 'A year playing with your name. Thanks for staying: this cake is yours.',
      'tuesday-13': '13 games on a Tuesday the 13th. Black cats, broken mirrors… and you just kept playing.',
      fiestas: "You played on September 18. ¡Viva Chile! A game between empanadas.",
      halloween: 'You played on October 31. Trick or treat? A game, of course.',
      xmas: 'You played on Christmas Day. Between presents and cake, you still found time for a game. Ho ho ho!',
      'new-year': 'You played on January 1. New year, same urge to play.',
    },
  },
  pt: {
    kicker: '🤫 Conquista secreta desbloqueada', count: 'Você tem {n} de {total} conquistas secretas', go: '🎖️ Ver minhas conquistas', later: 'Continuar jogando', close: 'Fechar', burst: 'SEGREDO!',
    msg: {
      'night-owl': 'Três jogos entre meia-noite e 4h. As corujas te saúdam; amanhã, café duplo.',
      'triple-crown': 'Campeão de copa, campeão do mês e número 1 de um jogo. Poucos chegam aqui em cima.',
      'one-year': 'Um ano jogando com seu nome. Obrigado por ficar: este bolo é seu.',
      'tuesday-13': '13 jogos numa terça-feira 13. Gato preto, espelho quebrado… e você jogando.',
      fiestas: 'Você jogou num 18 de setembro. Viva o Chile! Entre uma empanada e outra, um jogo.',
      halloween: 'Você jogou num 31 de outubro. Doces ou travessuras? Um jogo, claro.',
      xmas: 'Você jogou no Natal. Entre presentes e panetone, ainda achou tempo para um jogo. Ho ho ho!',
      'new-year': 'Você jogou no dia 1º de janeiro. Ano novo, a mesma vontade de jogar.',
    },
  },
};
/** Each secret achievement's own little rain, for look 'c'. */
export const RAIN = {
  'night-owl': ['🦉', '🌙', '⭐'], 'triple-crown': ['💎', '👑', '✨'], 'one-year': ['🎂', '🎈', '🎉'], 'tuesday-13': ['🐈‍⬛', '🍀', '🪞'],
  fiestas: ['🪁', '🇨🇱', '🥟'], halloween: ['🎃', '👻', '🍬'], xmas: ['🎄', '❄️', '🎁'], 'new-year': ['🎆', '🥂', '✨'],
};
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
const METAL = { gold: 1, silver: 2, bronze: 3 };

/** A medal in SVG, the month-end's with the achievement's emoji on its face (or «?» before it flips). */
function medal(face, back = false) {
  return `<svg class="me-medalla aw-medalla" viewBox="0 0 150 190" aria-hidden="true">
    <defs><linearGradient id="aw-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--m1)"/><stop offset=".55" stop-color="var(--m2)"/><stop offset="1" stop-color="var(--m3)"/></linearGradient>
    <clipPath id="aw-c"><circle cx="75" cy="122" r="52"/></clipPath></defs>
    <path d="M40 0h28l20 70H60z" fill="#ff2e88"/><path d="M82 0h28L90 70H62z" fill="#2ee6d6"/>
    <g class="aw-cara">
      <circle cx="75" cy="122" r="58" fill="var(--m3)"/><circle cx="75" cy="122" r="52" fill="url(#aw-g)"/>
      <circle cx="75" cy="122" r="40" fill="none" stroke="var(--m3)" stroke-width="2" stroke-dasharray="3 4" opacity=".6"/>
      <g clip-path="url(#aw-c)"><rect class="me-brillo" x="45" y="60" width="22" height="130" fill="#fff" opacity=".45" transform="skewX(-20)"/></g>
      <text class="aw-emoji" x="75" y="140" text-anchor="middle" font-size="50">${face}</text>
      ${back ? '<g class="aw-dorso"><circle cx="75" cy="122" r="58" fill="#2a0a4a"/><circle cx="75" cy="122" r="50" fill="#3d1466" stroke="#ff2e88" stroke-width="3" stroke-dasharray="6 5"/><text x="75" y="142" text-anchor="middle" font-family="Bangers, Impact, sans-serif" font-size="60" fill="#ffd23f">?</text></g>' : ''}
    </g>
  </svg>`;
}

/** Look 'c': the achievement's own emoji falling across the window, on the diagonal. */
function rain(layer, list) {
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div');
  box.className = 'aw-lluvia';
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.textContent = list[i % list.length];
    s.style.cssText = `left:${Math.random() * 110 - 5}%;animation-delay:${(Math.random() * 3).toFixed(2)}s;animation-duration:${(3.5 + Math.random() * 3).toFixed(2)}s;font-size:${(1.3 + Math.random() * 1.4).toFixed(2)}rem`;
    box.append(s);
  }
  layer.append(box);
}

/**
 * Opens the window for `badge` (`{ id, tier, icon, name }`). `secret`: `{ n, total }`. Resolves with 'go'
 * or 'close'. `profileHref`: where «Ver mis logros» goes.
 */
export function showAchievement(badge, { lang = 'es', style = 'a', secret = { n: 1, total: 8 }, profileHref = new URL('profile/#badges', ROOT).href, extra = null } = {}) {
  if (document.querySelector('.splash-capa')) return Promise.resolve('close');
  for (const [id, url] of [['month-end-css', new URL('assets/css/month-end.css', ROOT)], ['achievement-css', new URL('assets/css/achievement-window.css', ROOT)]]) {
    if (!document.getElementById(id)) document.head.append(Object.assign(document.createElement('link'), { id, rel: 'stylesheet', href: url.href }));
  }
  const T = TEXTS[lang] || TEXTS.es;
  const layer = document.createElement('div');
  layer.className = `splash-capa me-capa me-p${METAL[badge.tier] || 1} aw-capa aw-${style}`;
  const el = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls; if (text != null) n.textContent = text; return n; };
  const card = el('section', 'me-tarjeta aw-tarjeta');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', 'aw-titulo');
  if (style === 'c') card.append(el('div', 'aw-estallido', T.burst));
  card.insertAdjacentHTML('beforeend', medal(badge.icon, style === 'b'));
  card.append(el('div', 'me-kicker', T.kicker));
  const h = el('h2', 'me-titulo aw-titulo', badge.name);
  h.id = 'aw-titulo';
  card.append(h, el('p', 'me-linea', T.msg[badge.id] || ''));
  const count = el('div', 'aw-cuenta', fmt(T.count, secret));
  const dots = el('div', 'aw-puntos');
  for (let i = 0; i < secret.total; i++) dots.append(el('i', i < secret.n ? (i === secret.n - 1 ? 'on nuevo' : 'on') : ''));
  count.append(dots);
  const go = el('a', 'btn btn--yellow me-jugar', T.go);
  go.href = profileHref;
  const later = el('button', 'me-tabla', T.later);
  later.type = 'button';
  const x = el('button', 'me-x', '✕');
  x.type = 'button';
  x.setAttribute('aria-label', T.close);
  card.append(count, go, later, x);
  layer.append(el('div', style === 'b' ? 'aw-franjas' : 'me-rayos'), el('canvas', 'me-fuegos'));
  if (style === 'c') rain(layer, RAIN[badge.id] || ['✨', '🎉', '⭐']);
  layer.append(card);
  if (extra) layer.append(extra);
  document.body.append(layer);
  // The fireworks wait for the reveal in look 'b'
  let stopFire = () => {};
  const fire = () => { stopFire = fireworks(layer.querySelector('canvas')); };
  const t = setTimeout(fire, style === 'b' ? 1500 : style === 'c' ? 450 : 0);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  card.tabIndex = -1;
  card.focus({ preventScroll: true });
  return new Promise(res => {
    const close = how => {
      clearTimeout(t); stopFire();
      document.removeEventListener('keydown', onKey);
      layer.classList.add('sale');
      setTimeout(() => { layer.remove(); document.body.style.overflow = prevOverflow; res(how); }, 180);
    };
    const onKey = e => { if (e.key === 'Escape') close('close'); };
    document.addEventListener('keydown', onKey);
    x.addEventListener('click', () => close('close'));
    later.addEventListener('click', () => close('close'));
    go.addEventListener('click', () => res('go'));
  });
}
