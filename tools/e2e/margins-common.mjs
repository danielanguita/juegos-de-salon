/**
 * The key margins of the design system (docs/DESIGN.md §3 "Margins", the owner, 2026-11-11), measured
 * on every screenshot the scripts take (`b.shot()` in cdp.mjs) and reported by `look.mjs`, like the board
 * spacing (U-11) and overlaps (U-12): every e2e script watches them on every screen it photographs.
 *
 * - **M-1 Centered column:** the app's column (`.app`) is as far from the left of the window as from the right.
 * - **M-2 Even padding:** a card (`.panel`, `.notice`, `.mode`, a sheet, a splash window or card) has the same
 *   padding on its left and its right.
 * - **M-3 Even media:** a picture or clip that opens a card (its first child) is flush with the card on
 *   top and both sides, or keeps the same gap above as on each side (rule 7, `splash/margins.mjs`).
 *
 * - **M-4 Nothing covers the next block:** in a column, a block in the page's flow (a picture, a demo, a
 *   panel, a title, a text) never starts more than OVERLAP px above the bottom of the visible block before
 *   it, so a picture never sits on its title and a title never on its text (D-570). Side by side (a row of
 *   cards, a fan) is not a column; what floats on purpose (absolute, fixed, sticky: a stamp, a badge) is not
 *   in the flow, and so is inline text. A title under a hero's emoji or glyph (`.icon`, a crown, `*-icon`) rises over it by
 *   design, the emoji bringing its own air; two siblings set in the same grid cell (a card's pips and corners) are layers.
 *
 * An element marked `data-margins-ok` (a deliberate exception, with its reason next to it) is left out.
 */
export const TOLERANCE = 1;
/** M-4: how far a block may start above the bottom of the one before it (the title under the emoji icon: 2 px). */
export const OVERLAP = 4;
export const CARDS = '.panel, .notice, .mode, .hoja, .splash, .splash-item, .splash-item-cuerpo';

/** Code to evaluate in the page: JSON with one line per margin that breaks a rule. */
export const measureMargins = `(()=>{
  const T = ${TOLERANCE};
  const off = [];
  const visible = x => { const s = getComputedStyle(x), r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0; };
  const name = e => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') || e.tagName.toLowerCase();
  const skip = e => e.closest('[data-margins-ok]');
  const px = v => parseFloat(v) || 0;
  // M-1
  const app = document.querySelector('.app');
  if (app && visible(app) && !skip(app)) {
    const r = app.getBoundingClientRect(), W = document.documentElement.clientWidth;
    const l = r.left, rt = W - r.right;
    if (l >= 0 && rt >= 0 && Math.abs(l - rt) > T) off.push('M-1 ' + name(app) + ': ' + Math.round(l) + ' px left, ' + Math.round(rt) + ' px right');
  }
  // M-2
  for (const c of document.querySelectorAll(${JSON.stringify(CARDS)})) {
    if (!visible(c) || skip(c)) continue;
    const s = getComputedStyle(c), pl = px(s.paddingLeft), pr = px(s.paddingRight);
    if (Math.abs(pl - pr) > T) off.push('M-2 ' + name(c) + ': padding ' + pl + ' px left, ' + pr + ' px right');
  }
  // M-3
  for (const c of document.querySelectorAll(${JSON.stringify(CARDS)})) {
    if (!visible(c) || skip(c)) continue;
    const m = c.firstElementChild;
    if (!m || !m.matches('img, video, canvas, picture') || !visible(m) || skip(m)) continue;
    const s = getComputedStyle(c), a = m.getBoundingClientRect(), b = c.getBoundingClientRect();
    const top = a.top - b.top - px(s.borderTopWidth), left = a.left - b.left - px(s.borderLeftWidth), right = b.right - px(s.borderRightWidth) - a.right;
    // a card laid out in a row (a wide, short screen) has its picture at its left corner: flush on top and left
    if (getComputedStyle(c).flexDirection === 'row') {
      if (Math.abs(top) > T || Math.abs(left) > T) off.push('M-3 ' + name(m) + ' in ' + name(c) + ': ' + Math.round(top) + ' px above, ' + Math.round(left) + ' px left');
      continue;
    }
    if (Math.abs(left - right) > T || Math.abs(top - (left + right) / 2) > T)
      off.push('M-3 ' + name(m) + ' in ' + name(c) + ': ' + Math.round(top) + ' px above, ' + Math.round(left) + ' / ' + Math.round(right) + ' px at the sides');
  }
  // M-4
  const O = ${OVERLAP};
  const inFlow = e => { const s = getComputedStyle(e); return !['absolute', 'fixed', 'sticky'].includes(s.position) && s.float === 'none' && !['inline', 'contents'].includes(s.display); };
  // A hero's emoji or glyph (the game's icon, a crown, Uno al día's, Rankings') brings its own air: the title under it rises by design
  const heroIcon = x => { const c = x.getAttribute('class') || ''; return /(^|[\\s-])(icon|crown|crown-big|trophy|logo)([\\s-]|$)/.test(c) || /-(icon|logo)(\\s|$)/.test(c); };
  // Two siblings placed in the same grid cell on purpose (a card's pips and corners) are layers, not a column
  const placed = x => { const s = getComputedStyle(x); return s.gridRowStart !== 'auto' || s.gridArea.split('/')[0].trim() !== 'auto'; };
  // A playing card's face (its corners and pips) is a drawing, not a column of blocks
  const cardFace = x => x.parentElement?.closest('.face, .pcard');
  // A tilted or animated sticker (Nuevo, Popular) is drawn turned: its box is not where the layout put it
  const turned = x => getComputedStyle(x).transform !== 'none';
  const root = document.querySelector('.screen.active') || document.querySelector('.app') || document.body;
  for (const e of root.querySelectorAll('*')) {
    if (!visible(e) || skip(e) || !inFlow(e) || cardFace(e) || e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
    let p = e.previousElementSibling;
    while (p && (!visible(p) || !inFlow(p))) p = p.previousElementSibling;
    if (!p || skip(p) || heroIcon(p) || turned(p) || turned(e)) continue;
    if (getComputedStyle(e.parentElement).display.includes('grid') && (placed(e) || placed(p))) continue;
    const a = p.getBoundingClientRect(), b = e.getBoundingClientRect();
    const below = b.top >= a.top + a.height / 2;
    const across = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
    if (below && across && a.bottom - b.top > O) off.push('M-4 ' + name(e) + ' covers ' + name(p) + ' by ' + Math.round(a.bottom - b.top) + ' px');
  }
  return JSON.stringify(off);
})()`;
