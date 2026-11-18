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
  hit: () => { tone(240, 110, 0.18, 'sawtooth', 0.1); },
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
  const maxL = g.maxLives || E.LIVES;
  $('#hud-lives').textContent = '❤️'.repeat(Math.max(0, g.lives | 0)) + '🖤'.repeat(Math.max(0, maxL - (g.lives | 0)));
  $('#hud-dashes').textContent = g.dashes > 0 ? '⚡'.repeat(g.dashes) : '⚡ 0';
}

/* ---------------- Intro ---------------- */
function startDashDemo() {
  const c = $('#dash-demo');
  if (!c) return;
  const ctx = c.getContext('2d');
  const reduced = matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let t = reduced ? 1.4 : 0;
  let last = performance.now();

  const drawDemo = now => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!$('#screen-intro').classList.contains('active')) {
      requestAnimationFrame(drawDemo);
      return;
    }
    if (!reduced) t = (t + dt) % 9.6;
    const cycle = t < 3.2 ? 0 : t < 6.4 ? 1 : 2; // 0 = road + dash, 1 = water + dash, 2 = water + boat hop
    const p = t % 3.2;

    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = c.clientWidth || 320;
    const h = c.clientHeight || 96;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    const laneH = h / 3;

    // 3 horizontal lanes: top landing curb, middle hazard (road or water), bottom start curb
    ctx.fillStyle = '#2c6b3f';
    ctx.fillRect(0, 0, w, laneH);
    ctx.fillRect(0, laneH * 2, w, laneH);
    if (cycle === 0) {
      ctx.fillStyle = '#1b2238';
      ctx.fillRect(0, laneH, w, laneH);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = 12; x < w; x += 28) ctx.fillRect(x, laneH + laneH / 2 - 1, 14, 2);
    } else {
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(0, laneH, w, laneH);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.32)';
      const drift = (t * 28) % 36;
      for (let x = -36; x < w + 36; x += 36) ctx.fillRect(x + drift, laneH + laneH * 0.45, 16, 2.5);
    }

    // Moving car (cycle 0) or floating boat (cycles 1 & 2) in middle lane
    const frogBaseX = w * 0.24;
    let boatCenterX = frogBaseX;
    if (cycle === 0) {
      const carW = 40;
      const carH = laneH * 0.68;
      const carX = ((p * 85 + w * 0.1) % (w + carW)) - carW;
      const carY = laneH + (laneH - carH) / 2;
      ctx.fillStyle = '#ff5d6c';
      ctx.beginPath();
      ctx.roundRect(carX, carY, carW, carH, 6);
      ctx.fill();
      ctx.fillStyle = '#ff9aa4';
      ctx.beginPath();
      ctx.roundRect(carX + 8, carY + 3, carW - 16, carH - 6, 4);
      ctx.fill();
    } else {
      const boatW = 62;
      const boatH = laneH * 0.68;
      const boatY = laneH + (laneH - boatH) / 2;
      // In cycle 2, boat passes right under frogBaseX during 0.5..1.9s so frog hops on & rides it
      const boatX = cycle === 2
        ? frogBaseX - boatW * 0.45 + (p - 0.5) * 32
        : ((p * 55 + w * 0.45) % (w + boatW)) - boatW;
      boatCenterX = boatX + boatW * 0.5;

      ctx.fillStyle = 'rgba(224, 242, 254, 0.38)';
      ctx.fillRect(boatX - 10, boatY + boatH * 0.32, 10, 3);
      ctx.fillRect(boatX - 8, boatY + boatH * 0.62, 8, 3);
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(boatX, boatY, boatW, boatH, 7);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.roundRect(boatX + 6, boatY + 3, boatW - 12, boatH - 6, 5);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(boatX + boatW * 0.58, boatY + 5, boatW * 0.24, boatH - 10, 3);
      ctx.fill();
    }

    const startY = laneH * 2.5;
    const midY = laneH * 1.5;
    const endY = laneH * 0.5;

    // Glowing yellow Dash arrow (cycles 0 & 1)
    if (cycle < 2 && p >= 0.2 && p <= 1.35) {
      const a = p < 1.1 ? Math.min(0.85, (p - 0.2) * 2.2) : Math.max(0, (1.35 - p) * 3.4);
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      ctx.fillStyle = '#ffd94a';
      ctx.beginPath();
      ctx.moveTo(frogBaseX, endY - 4);
      ctx.lineTo(frogBaseX + 14, endY + 11);
      ctx.lineTo(frogBaseX + 6, endY + 11);
      ctx.lineTo(frogBaseX + 6, startY);
      ctx.lineTo(frogBaseX - 6, startY);
      ctx.lineTo(frogBaseX - 6, endY + 11);
      ctx.lineTo(frogBaseX - 14, endY + 11);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Frog position: Dash 2 lanes (cycles 0 & 1) OR hop onto floating boat, ride, hop off (cycle 2)
    let fx = frogBaseX;
    let fy = startY;
    let scale = 1;
    if (cycle < 2) {
      let jump = 0;
      if (p >= 1.0 && p < 1.6) jump = (p - 1.0) / 0.6;
      else if (p >= 1.6 && p < 2.75) jump = 1;
      const ease = 1 - Math.pow(1 - jump, 2);
      const arc = Math.sin(jump * Math.PI) * 14;
      fy = startY + (endY - startY) * ease - arc * 0.35;
      scale = 1 + Math.sin(jump * Math.PI) * 0.35;
    } else if (p < 0.45) {
      fy = startY;
    } else if (p < 0.85) {
      const hop1 = (p - 0.45) / 0.4;
      const ease = 1 - Math.pow(1 - hop1, 2);
      fx = frogBaseX + (boatCenterX - frogBaseX) * ease;
      fy = startY + (midY - startY) * ease - Math.sin(hop1 * Math.PI) * 6;
      scale = 1 + Math.sin(hop1 * Math.PI) * 0.22;
    } else if (p < 1.8) {
      fx = boatCenterX;
      fy = midY;
    } else if (p < 2.2) {
      const hop2 = (p - 1.8) / 0.4;
      const ease = 1 - Math.pow(1 - hop2, 2);
      const exitX = frogBaseX + (1.8 - 0.5) * 32;
      fx = exitX;
      fy = midY + (endY - midY) * ease - Math.sin(hop2 * Math.PI) * 6;
      scale = 1 + Math.sin(hop2 * Math.PI) * 0.22;
    } else {
      fx = frogBaseX + (1.8 - 0.5) * 32;
      fy = endY;
    }

    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#5de65a';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -5, 3, 0, Math.PI * 2);
    ctx.arc(4, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#13192c';
    ctx.beginPath();
    ctx.arc(-4, -5.5, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -5.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right-side swipe hand + label (long swipe for Dash, two short swipes for boat hop)
    const handX = w * 0.72;
    let swipeProg = 0;
    let handAlpha = 0.35;
    if (cycle < 2) {
      swipeProg = p < 1.05 ? Math.min(1, Math.max(0, (p - 0.15) / 0.85)) : 1;
      handAlpha = p < 1.35 ? 0.92 : Math.max(0.25, 1 - (p - 1.35) * 0.6);
    } else if (p < 1.2) {
      swipeProg = Math.min(0.45, Math.max(0, (p - 0.1) / 0.35) * 0.45);
      handAlpha = p < 0.8 ? 0.92 : 0.35;
    } else {
      swipeProg = Math.min(0.45, Math.max(0, (p - 1.45) / 0.35) * 0.45);
      handAlpha = p < 2.1 ? 0.92 : 0.3;
    }
    const handY = h * 0.78 - swipeProg * (h * 0.52);
    ctx.save();
    ctx.globalAlpha = handAlpha;
    ctx.strokeStyle = 'rgba(255, 217, 74, 0.55)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(handX, h * 0.78);
    ctx.lineTo(handX, handY);
    ctx.stroke();
    ctx.font = '18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👆', handX, handY);
    ctx.restore();

    const hint = cycle === 2 ? T.demoBoatHint : T.demoHint;
    ctx.font = '900 11px Nunito, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(10, 14, 28, 0.75)';
    ctx.fillText(hint, w - 9, h - 5);
    ctx.fillStyle = '#ffd94a';
    ctx.fillText(hint, w - 10, h - 6);

    ctx.restore();
    requestAnimationFrame(drawDemo);
  };
  requestAnimationFrame(drawDemo);
}

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

const QUIET = () => matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let flickerTimer = null;

function setDiffTheme(on) {
  document.body.classList.toggle('sp-hard', on);
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', on ? '#1c0512' : '#0b0e18');
}

function triggerWave(target, on) {
  if (QUIET()) return;
  const r = target.getBoundingClientRect();
  const d = el('div', { class: `sp-wave ${on ? '' : 'sp-wave--normal'}` });
  d.style.left = `${r.left + 36}px`;
  d.style.top = `${r.top + r.height / 2}px`;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 600);
}

function triggerLightning() {
  if (QUIET()) return;
  const f = el('div', { class: 'sp-flash' });
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 500);
}

function startFlicker(lever) {
  clearTimeout(flickerTimer);
  if (difficulty !== 'hard' || QUIET()) return;
  flickerTimer = setTimeout(() => {
    lever.classList.remove('zap');
    void lever.offsetWidth;
    lever.classList.add('zap');
    startFlicker(lever);
  }, 2400 + Math.random() * 4200);
}

function renderDiffLever() {
  const slot = $('#diff-seg');
  const hard = difficulty === 'hard';
  setDiffTheme(hard);

  const lever = el('button', {
    type: 'button',
    class: `sp-lever ${hard ? 'on' : ''}`,
    'aria-pressed': String(hard),
  },
    el('span', { class: 'sp-plate', 'aria-hidden': 'true' },
      el('span', { class: 'sp-track' }, el('span', { class: 'sp-groove' })),
      el('span', { class: 'sp-axle' }),
      el('span', { class: 'sp-arm' }, el('span', { class: 'sp-knob' })),
      el('span', { class: 'sp-bolt' }, '⚡'),
    ),
    el('span', { class: 'sp-lever-text' },
      el('b', {}, T.diffSwitch[hard ? 1 : 0].title),
      el('small', {}, T.diffSwitch[hard ? 1 : 0].sub),
    ),
  );

  lever.addEventListener('click', () => {
    const on = difficulty !== 'hard';
    difficulty = on ? 'hard' : 'normal';
    try { localStorage.setItem(DIFF_KEY, difficulty); } catch (_) { /* ignore */ }
    lever.classList.toggle('on', on);
    lever.setAttribute('aria-pressed', String(on));
    const idx = on ? 1 : 0;
    lever.querySelector('b').textContent = T.diffSwitch[idx].title;
    lever.querySelector('small').textContent = T.diffSwitch[idx].sub;
    setDiffTheme(on);
    triggerWave(lever, on);
    if (on) {
      triggerLightning();
      SFX.error();
      vibrate([15, 30, 15, 30, 40]);
      startFlicker(lever);
    } else {
      clearTimeout(flickerTimer);
      SFX.tap();
      vibrate(10);
    }
  });

  slot.replaceChildren(lever);
  startFlicker(lever);
}

function renderIntro() {
  renderDiffLever();
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
  startDashDemo();
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
  $('#lbl-stat-lives').textContent = T.statLives;
  $('#lbl-stat-time').textContent = T.statTime;
  $('#lbl-stat-total').textContent = T.statTotal;

  $('#val-dist').textContent = `+${g.distanceScore}`;
  $('#val-bonus').textContent = `+${g.bonusScore}`;
  $('#val-lives').textContent = g.lifePenalty ? `-${g.lifePenalty}` : '0';
  $('#val-time').textContent = `${g.elapsed.toFixed(1)}s`;
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

/* ---------------- Controls (board swipes + keyboard) ---------------- */
function triggerAction(action) {
  if (!g || g.mode === 'demo' || g.mode === 'win' || g.mode === 'crash') return;
  if (paused) {
    paused = false;
    $('#pause-layer').hidden = true;
    return;
  }
  const ok = E.act(g, action);
  if (ok) {
    save();
    updateHud();
  }
}

const SWIPE_EDGE_PAD = 18;
const HOP_DIST = 24;
const tileDashDist = rect => Math.max(84, Math.round(Math.min(rect.width / E.COLS, rect.height / 11.5) * 2.4));
const swipe = {
  active: false,
  committed: false,
  pointerId: null,
  x0: 0,
  y0: 0,
  x1: 0,
  y1: 0,
  dashDist: 120,
  hopDist: HOP_DIST,
  forwardProgress: 0,
  dashReady: true,
  notifiedDash: false,
  dir: null,
  fade: 0,
};

const stageEl = $('#stage');
const blockScroll = e => { if (!e.target.closest?.('button')) e.preventDefault(); };
stageEl.addEventListener('touchstart', blockScroll, { passive: false });
stageEl.addEventListener('touchmove', blockScroll, { passive: false });

stageEl.addEventListener('pointerdown', e => {
  if (e.target.closest?.('button') || paused || !g || g.mode === 'win' || g.mode === 'crash') return;
  const rect = stageEl.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x < SWIPE_EDGE_PAD || x > rect.width - SWIPE_EDGE_PAD || y < SWIPE_EDGE_PAD || y > rect.height - SWIPE_EDGE_PAD) return;
  e.preventDefault();
  unlockAudio();
  swipe.active = true;
  swipe.committed = false;
  swipe.pointerId = e.pointerId;
  swipe.dashDist = tileDashDist(rect);
  swipe.x0 = x;
  swipe.y0 = y;
  swipe.x1 = x;
  swipe.y1 = y;
  swipe.forwardProgress = 0;
  swipe.dashReady = g.dashes > 0;
  swipe.notifiedDash = false;
  swipe.dir = null;
  swipe.fade = 0;
  try { stageEl.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
});

stageEl.addEventListener('pointermove', e => {
  if (!swipe.active || swipe.committed || e.pointerId !== swipe.pointerId) return;
  e.preventDefault();
  const rect = stageEl.getBoundingClientRect();
  swipe.x1 = e.clientX - rect.left;
  swipe.y1 = e.clientY - rect.top;
  const dx = swipe.x1 - swipe.x0;
  const dy = swipe.y1 - swipe.y0;
  swipe.dashReady = !!g && g.dashes > 0;
  if (-dy > 10 && -dy >= Math.abs(dx)) {
    swipe.forwardProgress = -dy / swipe.dashDist;
    swipe.dir = swipe.forwardProgress >= 1 && swipe.dashReady ? 'dash' : 'up';
    if (swipe.forwardProgress >= 1 && swipe.dashReady && !swipe.notifiedDash) {
      swipe.notifiedDash = true;
      vibrate(8);
    }
  } else if (Math.abs(dx) >= HOP_DIST && Math.abs(dx) > Math.abs(dy)) {
    swipe.committed = true;
    swipe.forwardProgress = 0;
    swipe.dir = dx < 0 ? 'left' : 'right';
    triggerAction(swipe.dir);
  } else {
    swipe.forwardProgress = 0;
    swipe.dir = null;
  }
});

function endSwipe(e, commit) {
  if (!swipe.active || e.pointerId !== swipe.pointerId) return;
  const alreadyCommitted = swipe.committed;
  swipe.active = false;
  swipe.committed = false;
  swipe.pointerId = null;
  if (commit && !alreadyCommitted) {
    const dx = swipe.x1 - swipe.x0;
    const dy = swipe.y1 - swipe.y0;
    let action = null;
    if (-dy >= swipe.dashDist && -dy >= Math.abs(dx)) action = g && g.dashes > 0 ? 'dash' : 'up';
    else if (-dy >= HOP_DIST && -dy >= Math.abs(dx)) action = 'up';
    if (action) triggerAction(action);
    swipe.fade = swipe.forwardProgress > 0 || swipe.dir ? 0.18 : 0;
  } else {
    swipe.fade = 0;
  }
}

stageEl.addEventListener('pointerup', e => endSwipe(e, true));
stageEl.addEventListener('pointercancel', e => endSwipe(e, false));

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
  if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); triggerAction('up'); }
  else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); triggerAction('left'); }
  else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); triggerAction('right'); }
  else if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') { e.preventDefault(); triggerAction('dash'); }
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
  else if (ev.type === 'hit') { SND.hit(); vibrate(40); save(); }
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
    if (swipe.fade > 0) swipe.fade = Math.max(0, swipe.fade - dt);
    updateHud();
    scene.draw(g, swipe);
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
