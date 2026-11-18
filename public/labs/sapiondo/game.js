/**
 * Sapiondo: screens, touch/keyboard input, audio synth, session resume (C-6), sharing (C-7),
 * and result exits (C-19). Simulation is in engine.js; rendering is in scene.js.
 */
import { $, $$, el, vibrate, confetti } from '../../assets/js/ui.js';
import { getLang, coverLangToggle, applyStatic, COMMON } from '../../assets/js/i18n.js';
import { SFX, soundToggle, initSound, isMuted } from '../../assets/js/sound.js';
import { createSessionStore } from '../../assets/js/session.js';
import { trackStart, trackVisit, trackFinish } from '../../assets/js/transport/stats.js';
import { footerInto } from '../../assets/js/site-footer.js';
import { salidasFin } from '../../assets/js/fin.js';
import { botonCompartir, cabecera } from '../../assets/js/compartir.js';
import { coverWithDialogs } from '../../assets/js/cover-dialogs.js';
import { bloqueTabla, avisoPartida } from '../../assets/js/ranking.js';
import { rankingsVisibles } from '../../assets/js/jugador.js';
import { GAME_ID, FINISH_ROW, DEFAULT_CONFIG, LOCALES } from './rules.js';
import * as E from './engine.js';
import { createScene } from './scene.js';
import manifest from '../../assets/js/manifests/labs/sapiondo.js';

trackVisit();

const BEST_KEY = `juegos-de-salon:${GAME_ID}:best`;
const DIFF_KEY = `juegos-de-salon:${GAME_ID}:diff`;
const store = createSessionStore(GAME_ID);
const lang = getLang();
const L = LOCALES[lang] || LOCALES.es;
const T = L.ui;
const C = COMMON[lang] || COMMON.es;
const fmt = (s, vars = {}) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));

// Support ?seed=1234 in URL for repeatable Cup-style trials
const urlSeed = Number(new URLSearchParams(location.search).get('seed'));
let currentSeed = urlSeed > 0 ? Math.floor(urlSeed) : E.randomSeed();
let difficulty = 'normal';
try { if (localStorage.getItem(DIFF_KEY) === 'hard') difficulty = 'hard'; } catch (_) { /* ignore */ }

let g = null;
let paused = false;
let best = 0;
try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch (_) { /* ignore */ }

/* ---------------- WebAudio arcade tones ---------------- */
let ac = null;
let master = null;
function unlockAudio() {
  try {
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain();
      master.connect(ac.destination);
    }
    if (ac.state !== 'running') ac.resume();
  } catch (_) { /* silent fallback */ }
}
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
  crash: () => { tone(200, 65, 0.3, 'sawtooth', 0.12); },
  win: () => {
    tone(523, 523, 0.1, 'triangle', 0.1, 0);
    tone(659, 659, 0.1, 'triangle', 0.1, 0.09);
    tone(784, 784, 0.1, 'triangle', 0.1, 0.18);
    tone(1046, 1046, 0.24, 'triangle', 0.12, 0.27);
  },
};

/* ---------------- Screen & HUD ---------------- */
const scene = createScene($('#canvas'));
new ResizeObserver(() => scene.measure()).observe($('#stage'));

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (id === 'screen-play') scene.measure();
}

const save = () => {
  if (!g || g.mode === 'demo') return;
  store.save({
    mode: 'solo',
    state: E.serialize(g),
    done: g.mode === 'win' || g.mode === 'crash',
  });
};

function updateHud() {
  if (!g) return;
  const row = g.frog.row;
  const sec = E.sectorOf(row);
  $('#hud-dist').textContent = fmt(T.hudDist, { row, total: g.finishRow });
  $('#hud-sector').textContent = sec === 1 ? T.sector1 : sec === 2 ? T.sector2 : T.sector3;
  $('#hud-score').textContent = String(g.score);
  $('#hud-time').textContent = `${g.elapsed.toFixed(1)}s`;
  $('#hud-seed').textContent = fmt(T.hudSeed, { seed: g.seed });

  const comboEl = $('#hud-combo');
  if (g.combo > 1) {
    comboEl.hidden = false;
    comboEl.textContent = `x${g.combo}`;
  } else {
    comboEl.hidden = true;
  }

  const dashBtn = $('#btn-dash');
  if (g.dashCd <= 0) {
    dashBtn.classList.remove('cooldown');
    $('#lbl-dash').textContent = T.hudDashReady;
  } else {
    dashBtn.classList.add('cooldown');
    $('#lbl-dash').textContent = fmt(T.hudDashWait, { s: g.dashCd.toFixed(1) });
  }
}

/* ---------------- Intro ---------------- */
function renderResumeSlot() {
  const slot = $('#resume-slot');
  slot.innerHTML = '';
  const saved = store.load();
  if (!saved || saved.done || !saved.state) return;
  slot.append(el('div', { class: 'panel pop' },
    el('p', { class: 'lead' }, T.resumeTitle),
    el('div', { class: 'btn-row' },
      el('button', {
        class: 'btn btn--cyan btn--sm',
        onClick: () => {
          unlockAudio();
          g = E.hydrate(saved.state);
          if (!g) return startRun(currentSeed);
          paused = false;
          $('#pause-layer').hidden = true;
          scene.clear();
          showScreen('screen-play');
          updateHud();
        },
      }, T.resume),
      el('button', {
        class: 'btn btn--ghost btn--sm',
        onClick: () => { store.clear(); renderResumeSlot(); },
      }, T.delete),
    ),
  ));
}

function renderDiffSeg() {
  const seg = $('#diff-seg');
  const mk = (val, label) => el('button', {
    type: 'button',
    class: difficulty === val ? 'on' : '',
    'aria-pressed': String(difficulty === val),
    onClick: () => {
      SFX.tap();
      difficulty = val;
      try { localStorage.setItem(DIFF_KEY, val); } catch (_) { /* ignore */ }
      renderDiffSeg();
    },
  }, label);
  seg.replaceChildren(mk('normal', T.diffNormal), mk('hard', T.diffHard));
}

function renderIntro() {
  renderDiffSeg();
  $('#modes').replaceChildren(
    el('button', {
      class: 'mode',
      'data-mode': 'solo',
      onClick: () => { SFX.tap(); unlockAudio(); startRun(currentSeed); },
    },
    el('span', {}, el('b', {}, T.modeSolo), el('small', {}, T.modeSoloHint)),
    el('span', { class: 'go' }, '›')),
  );
  $('#how').replaceChildren(...L.como.map(step => el('li', {}, step)));

  const bestEl = $('#best-cover');
  if (best > 0) {
    bestEl.hidden = false;
    bestEl.replaceChildren(fmt(T.bestCover, { n: '' }), el('b', {}, String(best)));
  } else {
    bestEl.hidden = true;
  }

  renderResumeSlot();
  footerInto($('#pie'), { screen: 'sapiondo-cover', inbox: false, lang });
  coverWithDialogs($('#screen-intro'), { lang, alTocar: () => SFX.tap() });
}

/* ---------------- Play & Result ---------------- */
function startRun(seed) {
  currentSeed = seed;
  paused = false;
  $('#pause-layer').hidden = true;
  g = E.newGame({ ...DEFAULT_CONFIG, seed: currentSeed, difficulty, mode: 'ready' });
  scene.clear();
  save();
  trackStart({ game: GAME_ID, mode: 'solo', players: 1, difficulty });
  showScreen('screen-play');
  updateHud();
  $('#stage').focus({ preventScroll: true });
}

function finishRun() {
  save();
  const isWin = g.mode === 'win';
  const isBest = g.score > best;
  if (isBest) {
    best = g.score;
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (_) { /* ignore */ }
  }
  trackFinish({
    detalle: `${g.score} pts · ${g.maxRow}/${g.finishRow} lanes · ${g.elapsed.toFixed(1)}s · ${g.fruitsTaken} fruits · ${g.closeCalls} close · seed ${g.seed}`,
  });

  $('#result-title').textContent = isBest ? T.resultBest : isWin ? T.resultWin : T.resultCrash;
  $('#lbl-stat-dist').textContent = T.statDistance;
  $('#lbl-stat-bonus').textContent = T.statBonus;
  $('#lbl-stat-time').textContent = T.statTime;
  $('#lbl-stat-total').textContent = T.statTotal;

  $('#val-dist').textContent = `+${g.distanceScore}`;
  $('#val-bonus').textContent = `+${g.bonusScore}`;
  $('#val-time').textContent = `+${g.timeBonus}`;
  $('#val-total').textContent = String(g.score);
  $('#val-meta').textContent = fmt(T.statMeta, {
    lanes: g.maxRow,
    total: g.finishRow,
    time: g.elapsed.toFixed(1),
    fruits: g.fruitsTaken,
    close: g.closeCalls,
  });

  const shareSummary = fmt(isWin ? T.shareLineWin : T.shareLineCrash, {
    total: FINISH_ROW,
    lanes: g.maxRow,
    time: g.elapsed.toFixed(1),
    score: g.score,
    seed: g.seed,
  });

  $('#result-actions').replaceChildren(
    el('button', {
      class: 'btn btn--yellow',
      id: 'btn-replay-same',
      onClick: () => { SFX.tap(); unlockAudio(); startRun(g.seed); },
    }, fmt(T.againSame, { seed: g.seed })),
    el('button', {
      class: 'btn btn--cyan',
      id: 'btn-replay-new',
      onClick: () => { SFX.tap(); unlockAudio(); startRun(E.randomSeed()); },
    }, T.againNew),
    botonCompartir({
      rotulo: T.shareRotulo,
      id: 'btn-share',
      alTocar: () => SFX.tap(),
      avisos: { copied: C.shareCopied, downloaded: C.shareDownloaded },
      armar: async () => ({
        titulo: T.title,
        url: `${location.origin}${location.pathname}?seed=${g.seed}`,
        texto: [cabecera({ emoji: manifest.emoji, titulo: T.title, contexto: fmt(T.shareContext, { seed: g.seed }) }), shareSummary].join('\n\n'),
      }),
    }),
  );
  $('#result-exits').replaceChildren(salidasFin('lab', { lang, raiz: '../../' }));
  const rkEl = $('#ranking');
  const rkTitle = String((C.rk?.titleOf || '{game}')).replace('{game}', T.title);
  const tablaFin = bloqueTabla({ tabla: GAME_ID, titulo: rkTitle, entrar: false });
  const ms = Math.round(g.elapsed * 1000);
  rkEl.replaceChildren(...(rankingsVisibles() ? [avisoPartida({ juego: GAME_ID, s: g.score, ms, alAnotar: () => tablaFin.recargar() })] : []), tablaFin);
  if (isWin || isBest) confetti();
  showScreen('screen-result');
}

/* ---------------- Controls (3 overlay buttons + Dash + keyboard) ---------------- */
function triggerAction(action, btnEl) {
  if (!g || g.mode === 'demo' || g.mode === 'win' || g.mode === 'crash') return;
  if (paused) {
    paused = false;
    $('#pause-layer').hidden = true;
    return;
  }
  if (btnEl) {
    btnEl.classList.add('pressed');
    setTimeout(() => btnEl.classList.remove('pressed'), 90);
  }
  const ok = E.act(g, action);
  if (ok) {
    save();
    updateHud();
  }
}

function bindPad(id, action) {
  const btn = $(id);
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    unlockAudio();
    triggerAction(action, btn);
  });
}

bindPad('#btn-left', 'left');
bindPad('#btn-up', 'up');
bindPad('#btn-right', 'right');
bindPad('#btn-dash', 'dash');

$('#btn-left').setAttribute('aria-label', T.btnLeft);
$('#btn-up').setAttribute('aria-label', T.btnUp);
$('#btn-right').setAttribute('aria-label', T.btnRight);
$('#btn-dash').setAttribute('aria-label', T.btnDash);

$('#btn-pause').addEventListener('click', () => {
  if (!g || g.mode !== 'play') return;
  paused = !paused;
  $('#pause-layer').hidden = !paused;
});
$('#pause-layer').addEventListener('pointerdown', () => {
  paused = false;
  $('#pause-layer').hidden = true;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && g?.mode === 'play') {
    paused = true;
    $('#pause-layer').hidden = false;
    save();
  }
});

addEventListener('keydown', e => {
  if (!$('#screen-play').classList.contains('active')) return;
  if (e.target.closest?.('input, textarea')) return;
  if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); triggerAction('up', $('#btn-up')); }
  else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); triggerAction('left', $('#btn-left')); }
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); triggerAction('right', $('#btn-right')); }
  else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { e.preventDefault(); triggerAction('dash', $('#btn-dash')); }
  else if (e.code === 'KeyP') {
    if (g?.mode === 'play') { paused = !paused; $('#pause-layer').hidden = !paused; }
  }
});

/* ---------------- Fixed-timestep game loop ---------------- */
let lastFrame = performance.now();
let acc = 0;
let resultTimeout = null;

function handleEvent(ev) {
  if (ev.type === 'hop') SND.hop();
  else if (ev.type === 'dash') { SND.dash(); vibrate(12); }
  else if (ev.type === 'fruit') { SND.fruit(); vibrate(10); }
  else if (ev.type === 'closeCall') { SND.closeCall(); vibrate(18); }
  else if (ev.type === 'crash') {
    SND.crash();
    vibrate(80);
    clearTimeout(resultTimeout);
    resultTimeout = setTimeout(finishRun, 550);
  } else if (ev.type === 'win') {
    SND.win();
    vibrate([20, 30, 30]);
    clearTimeout(resultTimeout);
    resultTimeout = setTimeout(finishRun, 650);
  }
  scene.fx(ev, g, { closeCall: T.closeCall });
}

function loop(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (g && !paused && $('#screen-play').classList.contains('active')) {
    acc += dt;
    while (acc >= E.STEP) {
      E.step(g, E.STEP);
      scene.tick(E.STEP, g);
      acc -= E.STEP;
      if (g.events.length) {
        const evs = g.events.splice(0);
        evs.forEach(handleEvent);
      }
    }
    updateHud();
    scene.draw(g);
  }
  requestAnimationFrame(loop);
}

/* ---------------- Init ---------------- */
function init() {
  document.documentElement.lang = lang;
  document.title = T.docTitle;
  applyStatic(T);
  $('#pause-title').textContent = T.pauseTitle;
  $('#pause-hint').textContent = T.pauseHint;
  $('#lang-slot').append(coverLangToggle());
  $('#sound-slot').append(soundToggle());
  initSound();
  renderIntro();
  requestAnimationFrame(loop);
}

// Hook for end-to-end tests (C-14)
window.__sapiondo = {
  state: () => g,
  act: action => triggerAction(action),
  start: seed => startRun(seed || currentSeed),
};

init();
