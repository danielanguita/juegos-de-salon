/**
 * A game's cover animation alone in a page (cup/cover/, see its index.html): `?game=<id>` mounts the
 * game's `portada` (the demo that plays itself on its waiting room) or, without one, its `ejemplo` (the
 * "how to play" drawing), and tells the framing page its height: `{ type: 'cover-demo', game, height }`,
 * with height 0 when the game brings neither (the frame is then put away).
 */
import { el } from '../../assets/js/ui.js';
import { getLang } from '../../assets/js/i18n.js';
import { param } from '../../assets/js/parametros.js';
import { LOCALES } from '../rules.js';
import { loadGame } from '../games/index.js';

const game = param('game') || '';
/** The tallest an example drawing shows in the frame, in px. */
export const MAX_EXAMPLE = 260;
const ZOOMS = [1, 0.9, 0.8, 0.7];
const tell = height => { if (parent !== window) parent.postMessage({ type: 'cover-demo', game, height }, location.origin); };

/** What a game draws to show itself: its animated cover first, else its example. Pure but for the game's own nodes. */
export const demoOf = (J, { T, variante = null } = {}) => (J?.portada ? { kind: 'cover', node: J.portada({ variante }) }
  : J?.ejemplo ? { kind: 'example', node: J.ejemplo({ el, T, variante }) } : null);

if (typeof document !== 'undefined') {
  const lang = getLang();
  document.documentElement.lang = lang;
  const box = document.getElementById('demo');
  loadGame(game).then(J => {
    const demo = demoOf(J, { T: LOCALES[lang] || LOCALES.es });
    if (!demo?.node) return tell(0);
    box.dataset.kind = demo.kind;
    // The cover's demo sits where the waiting room puts it, so its own styles apply
    box.append(demo.kind === 'cover' ? el('div', { class: 'intro-hero' }, demo.node) : demo.node);
    // The drawing's height, now and whenever it changes (a stylesheet arriving, a caption wrapping). An example
    // drawn for a whole panel (Tango's, Zip's) is shrunk towards MAX_EXAMPLE px, so the sheet keeps room for its text
    let last = -1;
    const measure = () => {
      if (demo.kind === 'example') {
        // The largest step that fits (its figures may go side by side as it shrinks), never under MIN_ZOOM: its captions stay readable
        for (const z of ZOOMS) { box.style.zoom = z === 1 ? '' : String(z); if (box.getBoundingClientRect().height <= MAX_EXAMPLE) break; }
      }
      const h = Math.ceil(box.getBoundingClientRect().height);
      if (h !== last) { last = h; tell(h); }
    };
    new ResizeObserver(measure).observe(box);
    measure();
  }).catch(() => tell(0));
}
