/**
 * Tembleque / The Wobbles: the cover (C-2). It offers the two levels, each a page of its own that keeps the
 * owner's prototype whole: easy/ (2D, a plank) and hard/ (3D, a disc). Their ‹ comes back here.
 * Lab only (D-395); docs/games/wobbles.md.
 */
import { $, el } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic } from '../../assets/js/i18n.js';
import { trackVisit } from '../../assets/js/transport/stats.js';
import { footerInto } from '../../assets/js/site-footer.js';
import { abrirComentario } from '../../assets/js/labs-idioma.js';
import { GAME_ID, LOCALES } from './rules.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/wobbles.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;

function renderModes() {
  // The level keeps the chosen language: the pages read the same key, and `?lang` goes along if it came
  const level = (href, title, hint) => el('button', { type: 'button', class: 'mode', 'data-href': href, 'data-mode': href.replace('/', ''), onClick: () => { location.href = href + location.search; } },
    el('span', {}, el('b', {}, title), el('small', {}, hint)), el('span', { class: 'go' }, '›'));
  $('#modes').replaceChildren(level('easy/', T.easy, T.easyHint), level('hard/', T.hard, T.hardHint));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

// The cover ends with the site's footer, the game's own comment as its option (C-17, U-38)
function footer() {
  const comment = el('button', {
    type: 'button', class: 'link-btn', id: 'btn-comentario',
    onClick: () => abrirComentario({ T: L.comentario, contexto: { juego: GAME_ID, pantalla: 'cover', idioma: lang, url: location.pathname } }),
  }, T.comentarAbrir);
  footerInto($('#pie'), { screen: `${GAME_ID}-cover`, inbox: false, options: [comment], lang });
}

function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(coverLangToggle());
  renderModes();
  footer();
}

// The hook for the end-to-end tests (C-14)
window.__wobbles = { id: manifest.id, levels: ['easy', 'hard'] };
init();
