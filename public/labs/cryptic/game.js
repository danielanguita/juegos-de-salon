/**
 * Cryptic: screens and drawing (C-2), the only file that touches the DOM. The rules are in
 * engine.js, the texts in rules.js, the clues in clues.js. Screens: intro → play → result.
 * The round is saved after every move to resume it (C-6); each day's result is kept on the phone for
 * the streak. Lab only (D-395).
 */
import { $, $$, el, vibrate, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound } from '../../assets/js/sound.js';
import { createSessionStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { salidasFin } from '../../assets/js/fin.js';
import { coverWithDialogs } from '../../assets/js/cover-dialogs.js';
import { finDePartida } from '../../assets/js/ranking.js';
import { botonCompartir, cabecera } from '../../assets/js/compartir.js';
import { GAME_ID, CLUE_LANG, LOCALES } from './rules.js';
import { CLUES } from './clues.js';
import * as E from './engine.js';
// Its game.json as a module (node tools/generators/manifests.mjs): the facts are read from there
import manifest from '../../assets/js/manifests/labs/cryptic.js';

// Counts the visit on load, even if nobody plays (D-208)
trackVisit();

const store = createSessionStore(GAME_ID);
const DAYS_KEY = `juegos-de-salon:${GAME_ID}:days`;
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const BANK = CLUES[CLUE_LANG];
const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : '{' + k + '}'));
const today = () => E.localDate();

let state = null;
const clue = () => BANK[state.index];
const save = () => store.save({ mode: 'solo', state, done: !!state && E.isOver(state) });

/** Each day's result on this phone: { 'YYYY-MM-DD': { solved, stars, round } }. */
function readDays() { try { return JSON.parse(localStorage.getItem(DAYS_KEY) || '{}') || {}; } catch (_) { return {}; } }
function writeDay(date, round) {
  const days = readDays();
  days[date] = { solved: round.solved, stars: E.stars(round), round };
  try { localStorage.setItem(DAYS_KEY, JSON.stringify(days)); } catch (_) { /* no storage: the streak is not kept */ }
}

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

const starText = n => (n ? '⭐'.repeat(n) : '🏳️');

/* ---------------- Intro ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  // A clue half played (C-6): a practice one, or today's while it is still today
  if (!saved || saved.done || !saved.state || (!saved.state.practice && saved.state.date !== today())) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn btn--cyan btn--sm', onClick: () => { SFX.tap(); state = saved.state; renderPlay(); } }, T.resume),
      el('button', { class: 'btn btn--ghost btn--sm', onClick: () => { store.clear(); renderResumeSlot(); } }, T.delete),
    ),
  ));
}

function renderModes() {
  const d = today();
  const done = readDays()[d];
  // One way to play: the yellow start button (C-8); practice is a quiet second button under it
  $('#modes').replaceChildren(
    el('button', { class: 'btn btn--yellow', id: 'btn-play', 'data-mode': 'today', onClick: () => { SFX.tap(); startToday(); } },
      done ? T.modeTodayAgain : T.modeToday),
    el('p', { class: 'muted center today-note', id: 'today-note' },
      done ? fmt(T.modeTodayDone, { stars: starText(done.stars) }) : fmt(T.modeTodayHint, { n: E.numberOf(d) })),
    el('button', { class: 'btn btn--ghost btn--sm', id: 'btn-practice-cover', 'data-mode': 'practice', onClick: () => { SFX.tap(); startPractice(); } }, T.modePractice));
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));
}

function begin(round) {
  state = round;
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1 }); // usage signal (C-7, D-210)
  renderPlay();
}

function startToday() {
  const d = today();
  const saved = store.load();
  if (saved?.state && !saved.state.practice && saved.state.date === d) { state = saved.state; return renderPlay(); }
  const kept = readDays()[d];
  if (kept?.round) { state = kept.round; return renderPlay(); }
  begin(E.newRound(E.indexOf(d, BANK.length), { date: d }));
}

function startPractice() {
  const skip = E.indexOf(today(), BANK.length);
  let i = skip;
  while (BANK.length > 1 && i === skip) i = Math.floor(Math.random() * BANK.length);
  begin(E.newRound(i, { practice: true }));
}

/* ---------------- Play ---------------- */
/** The clue with its definition underlined once the second hint is out. */
function clueNodes(round, c) {
  const end = ' ' + E.enumeration(c.a);
  const at = round.hints >= 2 || E.isOver(round) ? c.c.indexOf(c.d) : -1;
  if (at < 0) return [c.c + end];
  return [c.c.slice(0, at), el('u', { class: 'def' }, c.d), c.c.slice(at + c.d.length) + end];
}

function renderTiles() {
  const want = E.normalize(clue().a);
  const typed = E.normalize($('#answer').value).slice(0, want.length);
  $('#tiles').replaceChildren(...[...want].map((_, i) => el('span', { class: 'tile' + (typed[i] ? ' tile--on' : '') }, typed[i] || '')));
}

function renderHints() {
  const c = clue();
  const lines = [fmt(T.hintKind, { kind: L.kinds[c.k] }), T.hintDef, fmt(T.hintFirst, { letter: E.normalize(c.a)[0] })];
  $('#hints').replaceChildren(...lines.slice(0, state.hints).map(t => el('li', {}, t)));
  const left = E.MAX_HINTS - state.hints;
  $('#btn-hint').textContent = T.hintBtn;
  $('#btn-hint').hidden = left <= 0;
}

function renderPlay() {
  if (E.isOver(state)) return renderResult();
  const c = clue();
  $('#clue-label').textContent = state.practice ? T.practiceLabel : fmt(T.clueNumber, { n: E.numberOf(state.date) });
  $('#clue-lang').hidden = lang === CLUE_LANG;
  $('#clue').replaceChildren(...clueNodes(state, c));
  const input = $('#answer');
  input.value = '';
  input.placeholder = T.placeholder;
  input.maxLength = c.a.length + 4;
  $('#feedback').hidden = true;
  renderTiles();
  renderHints();
  showScreen('screen-play');
}

function say(text, kind) {
  const f = $('#feedback');
  f.className = 'notice notice--' + kind;
  f.textContent = text;
  f.hidden = false;
}

function submit(ev) {
  ev?.preventDefault();
  const input = $('#answer');
  const c = clue();
  const { state: next, verdict } = E.guess(state, input.value, c);
  if (verdict === 'empty' || verdict === 'over') return;
  if (verdict === 'length') {
    SFX.error(); vibrate(40);
    say(fmt(T.lengthWrong, { n: E.normalize(c.a).length, m: E.normalize(input.value).length }), 'warn');
    return;
  }
  state = next;
  save();
  if (verdict === 'right') { SFX.win(); vibrate([30, 40, 30]); return finish(); }
  // A wrong guess is the normal move (C-8b, D-56): colour, shake, sound and a line that stays until the next one
  SFX.error(); vibrate(60);
  say(fmt(T.wrong, { g: state.guesses.at(-1) }), 'bad');
  const card = $('.clue-card');
  card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
  input.select();
}

function askHint() {
  SFX.reveal();
  state = E.hint(state);
  save();
  $('#clue').replaceChildren(...clueNodes(state, clue()));
  renderHints();
}

function giveUp() {
  SFX.tap();
  state = E.giveUp(state);
  save();
  finish();
}

function finish() {
  if (!state.practice) writeDay(state.date, state);
  trackFinish({ ganador: state.solved ? 'yo' : null });
  renderResult();
}

/* ---------------- Result (C-19) ---------------- */
function shareText() {
  const s = E.stars(state);
  const tries = state.guesses.length;
  const line = state.solved
    ? [starText(s), tries === 1 ? T.triesOne : fmt(T.tries, { n: tries }), state.hints ? fmt(T.shareHints, { n: state.hints }) : ''].filter(Boolean).join(' · ')
    : T.shareGaveUp;
  const contexto = state.practice ? T.practiceLabel : fmt(T.shareContext, { n: E.numberOf(state.date) });
  return [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto }), line].join('\n\n');
}

function renderResult() {
  const c = clue();
  const s = E.stars(state);
  const tries = state.guesses.length;
  $('#result-stars').textContent = starText(s);
  $('#result-title').textContent = state.solved ? T.solvedTitle : fmt(T.gaveUpTitle, { a: c.a });
  const parts = [];
  if (state.solved) parts.push(tries === 1 ? T.triesOne : fmt(T.tries, { n: tries }));
  if (state.practice) parts.push(T.practiceNote);
  else { const n = E.streak(readDays(), today()); if (n) parts.push(n === 1 ? T.streakOne : fmt(T.streakMany, { n })); }
  $('#result-line').textContent = parts.join(' · ');
  $('#result-clue').replaceChildren(...clueNodes(state, c));
  $('#result-explain').textContent = c.x;
  $('#result-next').textContent = state.practice ? '' : T.nextClue;
  $('#result-next').hidden = state.practice;

  const share = botonCompartir({
    rotulo: T.shareRotulo, id: 'btn-share', clase: state.practice ? 'btn btn--cyan' : 'btn btn--yellow', alTocar: () => SFX.tap(),
    avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
    armar: async () => ({ titulo: T.title, url: location.origin + location.pathname, texto: shareText() }),
  });
  const practice = el('button', { class: state.practice ? 'btn btn--yellow' : 'btn btn--cyan', id: 'btn-practice', onClick: () => { SFX.tap(); startPractice(); } }, T.practiceAgain);
  $('#result-actions').replaceChildren(...(state.practice ? [practice, share] : [share, practice]));
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  // A solo game: no win to count in the rankings yet (whether it keeps a score is the owner's call, D-212)
  finDePartida({ juego: GAME_ID, modo: 'solo', alTocar: () => SFX.tap() });
  if (state.solved) confetti();
  renderModes();
  showScreen('screen-result');
}

/* ---------------- Start ---------------- */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  // Instrucciones and Entrar as dialogs behind the lab flag cover-dialogs (C-8)
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });
  $('#answer-form').addEventListener('submit', submit);
  $('#answer').addEventListener('input', renderTiles);
  $('#btn-hint').addEventListener('click', askHint);
  $('#btn-give-up').addEventListener('click', giveUp);
  renderModes();
  renderResumeSlot();
}

// The hook for the end-to-end tests (C-14): the state, the clue and its answer
window.__cryptic = { state: () => state, clue: () => (state ? clue() : null), answer: () => (state ? clue().a : null) };
init();
