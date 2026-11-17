/**
 * Sapiondo in La Copa: cover, title, mount, result, and breakdown.
 */
import { newGame, step, act, score, card, sectorOf, FINISH_ROW, PAR_TIME, STEP } from './engine.js';
import { createScene } from './scene.js';
import { onScreen } from '../../../assets/js/on-screen.js';
import { loadCss } from '../../../assets/js/load-css.js';
import { getLang } from '../../../assets/js/i18n.js';
import { isMuted } from '../../../assets/js/sound.js';
import TEXTOS from './texts.js';

await loadCss(new URL('./style.css', import.meta.url));

const QUIETO = () => !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmtLocal = (s, o = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const forma = n => (n === 0 ? 0 : n === 1 ? 1 : 2);
const UI = () => { let l = 'es'; try { l = getLang(); } catch (_) { /* node */ } return (TEXTOS[l] || TEXTOS.es).ui; };

function h(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  }
  for (const x of kids.flat()) if (x !== null && x !== undefined && x !== false) n.append(x instanceof Node ? x : String(x));
  return n;
}

/* ---------------- Sound ---------------- */
let ac = null;
let master = null;
function unlockAudio() {
  try {
    if (!ac) { ac = new (globalThis.AudioContext || globalThis.webkitAudioContext)(); master = ac.createGain(); master.connect(ac.destination); }
    if (ac.state !== 'running') ac.resume();
  } catch (_) { /* silent */ }
}
globalThis.document?.addEventListener('click', ev => { if (ev.target?.closest?.('#btn-empezar, #btn-continuar, .btn')) unlockAudio(); }, true);
function tone(f0, f1, dur, type = 'sine', vol = 0.1, delay = 0) {
  if (isMuted() || !ac || ac.state !== 'running') return;
  try {
    const o = ac.createOscillator();
    const gn = ac.createGain();
    const t0 = ac.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    gn.gain.setValueAtTime(vol, t0);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gn).connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch (_) { /* ignore */ }
}
const SND = {
  hop: () => tone(320, 540, 0.07, 'triangle', 0.08),
  dash: () => { tone(440, 980, 0.11, 'sine', 0.1); tone(660, 1120, 0.09, 'triangle', 0.06, 0.03); },
  fruit: () => { tone(740, 1080, 0.08, 'sine', 0.1); tone(1080, 1440, 0.1, 'sine', 0.09, 0.06); },
  closeCall: () => { tone(880, 1320, 0.07, 'square', 0.045); tone(1320, 1760, 0.1, 'triangle', 0.07, 0.05); },
  crash: () => tone(200, 65, 0.3, 'sawtooth', 0.12),
  win: () => { tone(523, 523, 0.1, 'triangle', 0.1, 0); tone(659, 659, 0.1, 'triangle', 0.1, 0.09); tone(784, 784, 0.1, 'triangle', 0.1, 0.18); tone(1046, 1046, 0.24, 'triangle', 0.12, 0.27); },
};

/* ---------------- Waiting room ---------------- */
let demoId = 0;
export function cover() {
  const canvas = h('canvas', { class: 'sp-demo', 'aria-hidden': 'true' });
  const root = h('div', { class: 'sp-portada', 'aria-hidden': 'true' }, canvas);
  const id = ++demoId;
  const sc = createScene(canvas);
  let g = null;
  let last = 0;
  let acc = 0;
  let seen = false;
  const startAt = performance.now();

  const tickDemo = now => {
    if (canvas.isConnected) seen = true;
    if (id !== demoId || (!canvas.isConnected && (seen || now - startAt > 5000))) return;
    if (canvas.isConnected && !g) { sc.measure(); g = newGame({ seed: 4821, mode: 'demo' }); sc.clear(); last = now; }
    if (g) {
      if (QUIETO()) { sc.draw(g); return; }
      acc += Math.min(0.05, (now - last) / 1000);
      last = now;
      while (acc >= STEP) { step(g, STEP); sc.tick(STEP, g); g.events.length = 0; acc -= STEP; }
      sc.draw(g);
    }
    next();
  };
  const next = onScreen(canvas, tickDemo);
  next();
  return root;
}

export function title({ el, J }) {
  const U = UI();
  return el('div', { class: 'sp-cabeza' },
    el('h2', { class: 'sp-titulo' },
      el('span', { 'aria-hidden': 'true' }, '🐸'),
      el('span', { class: 'display display--lg rainbow' }, J.nombre)),
    el('p', { class: 'sp-lema' }, U.spLema));
}

/* ---------------- Play ---------------- */
let activeRun = 0;

export function mount(raiz, ctx) {
  const { p = {}, T, el, vibrate = () => {} } = ctx;
  const fmt = ctx.fmt || fmtLocal;
  const prev = ctx.jugadas && typeof ctx.jugadas === 'object' && !Array.isArray(ctx.jugadas) && Number.isFinite(ctx.jugadas.score) ? ctx.jugadas : null;
  const runId = ++activeRun;
  unlockAudio();

  const canvas = el('canvas', { class: 'sp-lienzo', 'aria-hidden': 'true' });
  const distEl = el('span', {}, '0/33');
  const sectorEl = el('small', {}, T.spSector1);
  const scoreEl = el('div', { class: 'sp-score', 'aria-live': 'polite' }, '0');
  const comboEl = el('span', { class: 'sp-combo', hidden: true }, 'x2');
  const dashLbl = el('span', {}, T.spDashReady);
  const btnDash = el('button', { type: 'button', class: 'sp-pad-btn sp-pad-dash', id: 'sp-dash' }, el('span', { 'aria-hidden': 'true' }, '⚡'), dashLbl);
  const btnLeft = el('button', { type: 'button', class: 'sp-pad-btn', id: 'sp-left', 'aria-label': 'Left' }, '◀');
  const btnUp = el('button', { type: 'button', class: 'sp-pad-btn sp-pad-up', id: 'sp-up', 'aria-label': 'Forward' }, '▲');
  const btnRight = el('button', { type: 'button', class: 'sp-pad-btn', id: 'sp-right', 'aria-label': 'Right' }, '▶');
  const controls = el('div', { class: 'sp-controls' }, btnDash, el('div', { class: 'sp-pad-row' }, btnLeft, btnUp, btnRight));
  const pauseEl = el('div', { class: 'sp-pausa', hidden: true },
    el('span', { class: 'display display--lg' }, T.spPaused),
    el('span', {}, T.spResume));

  const stage = el('div', { class: 'sp-escenario', tabindex: 0 },
    canvas,
    el('div', { class: 'sp-hud' },
      el('div', { class: 'sp-pill' }, distEl, sectorEl),
      el('div', { class: 'sp-center' }, scoreEl, comboEl)),
    controls,
    pauseEl);
  const finEl = el('div', { class: 'sp-fin' });
  const wrap = el('div', { class: 'sp-juego' }, stage, finEl);
  raiz.append(wrap);

  const sc = createScene(canvas);
  sc.measure();
  const finishRow = p.finishRow || FINISH_ROW;
  const parTime = p.parTime || PAR_TIME;
  const g = newGame({ seed: p.semilla ?? 4821, finishRow, parTime, mode: 'ready' });
  new ResizeObserver(() => { if (runId === activeRun && canvas.isConnected) sc.measure(); }).observe(stage);

  const S = { fin: false, paused: false, pauseAt: 0, pausedMs: 0, startedAt: 0, ms: 0, last: performance.now(), acc: 0 };

  const paintHud = () => {
    const row = g.frog.row;
    const sec = sectorOf(row);
    distEl.textContent = fmt(T.spDist, { row, total: g.finishRow });
    sectorEl.textContent = sec === 1 ? T.spSector1 : sec === 2 ? T.spSector2 : T.spSector3;
    scoreEl.textContent = String(g.score);
    comboEl.hidden = g.combo <= 1;
    if (g.combo > 1) comboEl.textContent = `x${g.combo}`;
    if (g.dashCd <= 0) {
      btnDash.classList.remove('cooldown');
      dashLbl.textContent = T.spDashReady;
    } else {
      btnDash.classList.add('cooldown');
      dashLbl.textContent = fmt(T.spDashWait, { s: g.dashCd.toFixed(1) });
    }
  };
  paintHud();

  const estado = () => ({
    fin: S.fin,
    won: g.mode === 'win',
    score: g.score,
    maxRow: g.maxRow,
    finishRow: g.finishRow,
    fruitsTaken: g.fruitsTaken,
    closeCalls: g.closeCalls,
    timeBonus: g.timeBonus,
    ms: S.fin ? S.ms : (S.startedAt ? Math.round(performance.now() - S.startedAt - S.pausedMs) : 0),
  });

  const acCtrl = new AbortController();
  const pause = () => {
    if (!canvas.isConnected) { acCtrl.abort(); return; }
    if (S.fin || S.paused || runId !== activeRun || g.mode !== 'play') return;
    S.paused = true;
    S.pauseAt = performance.now();
    pauseEl.hidden = false;
  };
  const resume = () => {
    S.pausedMs += performance.now() - S.pauseAt;
    S.paused = false;
    pauseEl.hidden = true;
    S.last = performance.now();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); }, { signal: acCtrl.signal });
  addEventListener('pagehide', pause, { signal: acCtrl.signal });
  pauseEl.addEventListener('pointerdown', e => { e.preventDefault(); resume(); }, { signal: acCtrl.signal });

  function finish(reason, { fresh = true } = {}) {
    if (S.fin) return;
    S.ms = S.startedAt ? Math.round(performance.now() - S.startedAt - S.pausedMs) : (prev?.ms || 0);
    S.fin = true;
    S.paused = false;
    pauseEl.hidden = true;
    controls.hidden = true;
    acCtrl.abort();
    const st = estado();
    ctx.guardar?.(st);
    ctx.pararReloj?.(st);
    finEl.replaceChildren(
      el('p', { class: 'sp-veredicto' }, reason === 'win' ? T.spWin : T.spCrash),
      el('button', { type: 'button', class: 'btn btn--yellow', id: 'btn-fin', onClick: () => ctx.terminar(estado()) }, ctx.textoFin || T.spContinue));
    if (fresh) requestAnimationFrame(() => finEl.scrollIntoView?.({ block: 'nearest', behavior: QUIETO() ? 'auto' : 'smooth' }));
  }

  function trigger(action, btn) {
    if (S.fin || runId !== activeRun) return;
    if (S.paused) { resume(); return; }
    if (g.mode === 'ready') { S.startedAt = performance.now(); unlockAudio(); }
    if (btn) { btn.classList.add('pressed'); setTimeout(() => btn.classList.remove('pressed'), 90); }
    if (act(g, action)) {
      ctx.guardar?.(estado());
      paintHud();
    }
  }

  const bind = (btn, action) => btn.addEventListener('pointerdown', e => { e.preventDefault(); trigger(action, btn); }, { signal: acCtrl.signal });
  bind(btnLeft, 'left');
  bind(btnUp, 'up');
  bind(btnRight, 'right');
  bind(btnDash, 'dash');

  addEventListener('keydown', e => {
    if (S.fin || runId !== activeRun || e.target.closest?.('input, textarea')) return;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); trigger('up', btnUp); }
    else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); trigger('left', btnLeft); }
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); trigger('right', btnRight); }
    else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { e.preventDefault(); trigger('dash', btnDash); }
  }, { signal: acCtrl.signal });

  const onEvent = ev => {
    if (ev.type === 'hop') SND.hop();
    else if (ev.type === 'dash') { SND.dash(); vibrate(12); }
    else if (ev.type === 'fruit') { SND.fruit(); vibrate(10); }
    else if (ev.type === 'closeCall') { SND.closeCall(); vibrate(18); }
    else if (ev.type === 'crash') { SND.crash(); vibrate(80); finish('crash'); }
    else if (ev.type === 'win') { SND.win(); vibrate([20, 30, 30]); finish('win'); }
    sc.fx(ev, g, { closeCall: T.spCloseCall });
  };

  const frame = now => {
    if (runId !== activeRun || !canvas.isConnected) { acCtrl.abort(); return; }
    if (!S.paused) {
      S.acc += Math.min(0.05, (now - S.last) / 1000);
      while (S.acc >= STEP) {
        step(g, STEP);
        sc.tick(STEP, g);
        S.acc -= STEP;
        if (g.events.length) {
          g.events.splice(0).forEach(onEvent);
          paintHud();
        }
      }
    }
    S.last = now;
    sc.draw(g);
    if (S.fin && (S.sleepAt ||= now + 900) < now) return;
    requestAnimationFrame(frame);
  };

  if (prev) {
    g.score = prev.score | 0;
    g.maxRow = prev.maxRow | 0;
    g.fruitsTaken = prev.fruitsTaken | 0;
    g.closeCalls = prev.closeCalls | 0;
    g.timeBonus = prev.timeBonus | 0;
    g.mode = prev.won ? 'win' : 'crash';
    g.frog.row = g.maxRow;
    g.frog.y = g.maxRow;
    paintHud();
    finish(prev.won ? 'win' : 'crash', { fresh: false });
    S.ms = prev.ms || 0;
  } else {
    stage.focus({ preventScroll: true });
  }
  requestAnimationFrame(frame);

  window.__sapiondoCopa = { get g() { return g; }, act: a => trigger(a), estado };
}

export function result(e) {
  const s = score(e);
  const maxRow = Math.max(0, e?.maxRow | 0);
  const closeCalls = Math.max(0, e?.closeCalls | 0);
  return {
    s,
    t: card(e),
    resumen: String(s),
    ms: Number.isFinite(e?.ms) ? Math.round(e.ms) : undefined,
    d: maxRow * 100 + closeCalls,
  };
}

export function breakdown(e, { T, fmt = fmtLocal }) {
  if (!e) return [];
  const rows = Math.max(0, e.maxRow | 0);
  const total = Math.max(1, e.finishRow | 0);
  const bonuses = Math.max(0, (e.fruitsTaken | 0) + (e.closeCalls | 0));
  const timeBonus = Math.max(0, e.timeBonus | 0);
  return [
    fmt(T.spBdDist, { n: rows, total }),
    bonuses ? fmt(T.spBdBonus[forma(bonuses)], { n: bonuses }) : null,
    timeBonus ? fmt(T.spBdTime, { n: timeBonus }) : null,
  ].filter(Boolean);
}
