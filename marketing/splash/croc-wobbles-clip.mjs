// The clips of the `nos-volvimos-locos` splash (🐸 Croc! and ⚖️ Tembleque, the owner's request, 2026-11-21):
// real play, recorded from the real games, with a camera that moves. A bot plays each game through its own
// input (Croc!'s window.__croc.act, Tembleque's taps and arrow keys), the page's clock is driven frame by frame
// (requestAnimationFrame and performance.now stand still between frames, so the recording is smooth whatever the
// machine), and each frame the game's canvas is drawn through a camera into a square: it pushes in when
// something happens (a dash, a fruit, a close call, a balanced drop) and eases back out.
//
// The games write words on their canvas (¡CERCA!, ¡CLAVADO!, NUEVA: LADRILLO), so each language gets its own
// clip, played the same (same seeds, same bot): `video` in the campaign is { es, en, pt }.
//
//   python3 -m http.server 8793 -d public &
//   SITE=http://localhost:8793 node marketing/splash/croc-wobbles-clip.mjs [croc|wobbles] [es en pt]
//
// Output, in public/assets/splash/: croc-<lang>.mp4 and wobbles-<lang>.mp4 (540×540, 30 fps, muted), and from
// the Spanish take the posters croc-start.jpg / wobbles-start.jpg (the first frame, no words) and the stills
// for reduced motion croc.jpg / wobbles.jpg.
// Tembleque's clip is both levels: easy (2D) and, through a zoom, hard (3D) with its opening turn.
import { mkdirSync, rmSync, writeFileSync, readdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { launch } from '../../tools/e2e/cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8793';
const DEST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'assets', 'splash');
const TMP = '/tmp/croc-wobbles-clip';
const SIDE = 540;
const args = process.argv.slice(2);
const only = args.filter(a => a === 'croc' || a === 'wobbles');
const langs = args.filter(a => /^(es|en|pt)$/.test(a));
const GAMES = only.length ? only : ['croc', 'wobbles'];
const LANGS = langs.length ? langs : ['es', 'en', 'pt'];

// The page's clock, driven from here: `__tick(ms)` moves time on and runs the frame
const CLOCK = `(() => {
  let vt = 1000; const q = [];
  performance.now = () => vt;
  window.requestAnimationFrame = cb => { q.push(cb); return q.length; };
  window.cancelAnimationFrame = () => {};
  window.__tick = ms => { vt += ms; for (const cb of q.splice(0)) { try { cb(vt); } catch (e) { console.error(e); } } };
})();`;

// The camera: a square of the game's canvas, `z` times closer than its widest, centred on (x, y), eased each frame.
// `cam(goal)` takes where it wants to be ({ z, x, y }) and draws the frame into the square canvas.
const CAMERA = `(() => {
  const out = document.createElement('canvas'); out.width = out.height = ${SIDE};
  const o = out.getContext('2d'); o.imageSmoothingQuality = 'high';
  let cur = null;
  window.__cam = (src, goal, base, bg) => {
    if (!cur) cur = { ...goal };
    for (const k of ['z', 'x', 'y']) cur[k] += (goal[k] - cur[k]) * (k === 'z' ? 0.16 : 0.2);
    const side = base / cur.z;
    const x = Math.max(side / 2, Math.min(src.width - side / 2, cur.x)), y = Math.max(side / 2, Math.min(src.height - side / 2, cur.y));
    o.fillStyle = bg; o.fillRect(0, 0, ${SIDE}, ${SIDE});
    o.drawImage(src, x - side / 2, y - side / 2, side, side, 0, 0, ${SIDE}, ${SIDE});
    return out.toDataURL('image/jpeg', 0.92);
  };
})();`;

/** Plays one take: `setup` once the page is ready, then `frame` (bot + camera, returns a JPEG) every 1/30 s. */
async function take({ url, width, height, storage = {}, start, setup, frame, frames, sub = 1, dir }) {
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const b = await launch({ dir: `${TMP}/profile-${width}`, out: TMP, width, height });
  const ev = e => b.evaluate(e);
  await b.send('Page.addScriptToEvaluateOnNewDocument', { source: CLOCK + CAMERA });
  await b.go(url, 1200);
  await ev(`localStorage.clear(); ${Object.entries(storage).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join(' ')} 1`);
  await b.go(url, 1500);
  for (let i = 0; i < 10; i++) await ev(`__tick(16.667); 1`);
  await ev(start);
  for (let i = 0; i < 300 && !(await ev(setup.ready)); i++) { await ev(`__tick(33.333); 1`); await new Promise(r => setTimeout(r, 20)); }
  await ev(setup.bot);
  let n = 0;
  for (let k = 0; n < frames; k++) {
    const r = await ev(`(() => { ${frame.step}; __tick(${33.333 / sub}); ${k % sub === sub - 1 ? `return (${frame.shot})();` : `return '';`} })()`);
    if (r === 'END') break;
    if (r) writeFileSync(`${dir}/f${String(n++).padStart(4, '0')}.jpg`, Buffer.from(r.split(',')[1], 'base64'));
  }
  b.close();
  return n;
}

// 🐸 Croc!: across the whole highway, the canal and to the pond (seed 4821: three fruits, a dash, close calls)
const CROC = {
  // Its page /croc/ (La Copa's screen since it left the lab, D-517's way), its flag pinned on for the take
  url: lang => `${SITE}/croc/?test&seed=4821&lang=${lang}`,
  width: 390, height: 844,
  storage: lang => ({ 'juegos-de-salon:lang': lang, 'juegos-de-salon:flags': JSON.stringify({ croc: { state: 'all' } }) }),
  start: `document.getElementById('btn-empezar').click(); 1`,
  setup: {
    ready: `!document.getElementById('cuenta') && !!window.__croc?.state() && !!document.querySelector('canvas.sp-lienzo')`,
    // Hops when the lane ahead is clear, steps aside for a fruit, dashes over a lane that is not
    bot: `(() => {
      const COLS = 7;
      const clear = (lane, col, la) => {
        if (!lane) return true;
        if (lane.kind === 'water') { const fx = col + 0.5 + lane.dir * lane.speed * la * 0.5; return lane.vehicles.some(b => fx >= b.x + 0.05 && fx <= b.x + b.len - 0.05); }
        if (lane.kind !== 'road') return true;
        const fx = col + 0.5;
        for (const v of lane.vehicles) for (const t of [0, la * 0.5, la]) { const nx = v.x + lane.dir * lane.speed * t; if (fx + 0.42 > nx && fx - 0.42 < nx + v.len) return false; }
        return true;
      };
      let wait = 0;
      window.__bot = () => {
        const g = window.__croc.state(); if (!g || (g.mode !== 'play' && g.mode !== 'ready')) return;
        const f = g.frog; if (f.fromCol !== f.toCol || f.fromRow !== f.toRow || performance.now() < wait) return;
        const L = r => g.lanes[r];
        const act = a => { window.__croc.act(a); wait = performance.now() + 200; };
        const fr = g.fruits.find(x => !x.taken && x.row === f.row + 1);
        if (fr && fr.col !== f.col && Math.abs(fr.col - f.col) <= 2) {
          const d = fr.col > f.col ? 1 : -1;
          if (clear(L(f.row), f.col + d, 0.3) && clear(L(f.row + 1), f.col + d, 0.5)) return act(d > 0 ? 'right' : 'left');
        }
        if (clear(L(f.row + 1), f.col, 0.32)) return act('up');
        if (g.dashes > 0 && L(f.row + 1)?.kind === 'road' && clear(L(f.row + 2), f.col, 0.4)) return act('dash');
        for (const d of [1, -1]) { const c = f.col + d; if (c >= 0 && c < COLS && clear(L(f.row), c, 0.3) && clear(L(f.row + 1), c, 0.5)) return act(d > 0 ? 'right' : 'left'); }
      };
      // The camera: the whole road, pushing in on the frog at each dash, fruit, close call or hit, and at the pond
      const cv = document.querySelector('canvas.sp-lienzo');
      let kick = 0, kz = 1, last = null, end = 0;
      window.__shot = () => {
        const g = window.__croc.state(), f = g.frog, W = cv.width, H = cv.height;
        const tile = Math.min(W / 7.35, H / 8.8), fx = (W - 7 * tile) / 2 + (f.x + 0.5) * tile, fy = H * 0.72 - tile * 0.5;
        const now = { dash: f.isDash, fruits: g.fruitsTaken, close: g.closeCalls, lives: g.lives };
        if (last) {
          if (now.dash && !last.dash) { kick = 22; kz = 1.4; }
          if (now.fruits > last.fruits) { kick = 18; kz = Math.max(kz, 1.3); }
          if (now.close > last.close) { kick = 18; kz = Math.max(kz, 1.32); }
          if (now.lives < last.lives) { kick = 24; kz = 1.45; }
        } else { kick = 26; kz = 1.7; }
        last = now;
        let z = kick-- > 0 ? kz : 1;
        if (g.mode === 'win') { z = 1.6; if (++end > 40) return 'END'; }
        if (kick <= 0) kz = 1;
        const side = W / z, k = Math.min(1, (z - 1) / 0.3);
        return __cam(cv, { z, x: W / 2 + (fx - W / 2) * k, y: fy - side * 0.2 }, W, '#1b2238');
      };
      return 1;
    })()`,
  },
  frame: { step: `__bot()`, shot: `__shot` },
  frames: 420,
};

// ⚖️ Tembleque, easy: the claw over the plank, the bot dropping each piece to bring the plank back level
const EASY = {
  url: lang => `${SITE}/wobbles/easy/?test&quality=1&seed=7&from=10&lang=${lang}`,
  width: 480, height: 560,
  storage: lang => ({ 'juegos-de-salon:lang': lang, 'balanza-lab:start-pieces': '3' }),
  start: `document.getElementById('cBtn').click(); 1`,
  setup: {
    ready: `window.__balanza.state === 'play'`,
    bot: `(() => {
      const B = window.__balanza, cv = document.getElementById('cv');
      let side = 1;
      window.__bot = () => {
        const S = B.S; if (!S || B.state !== 'play' || !S.held) return;
        const pl = S.plank, m = B.MASS * 1000;
        let load = pl.load; for (const x of S.bodies) load += x.m * (x.x - pl.x);
        // Where the plank's weight wants the next piece, a little to one side and then the other, so it rocks
        const rel = Math.max(-B.HALF * 0.75, Math.min(B.HALF * 0.75, -(load / m) * 0.9 - pl.s * 900 + side * 10));
        if (Math.abs(S.car.x - (pl.x + rel)) < S.P.speed * B.DT * 3) { side = -side; cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); }
      };
      // world → canvas
      const px = (x, y) => [dpr * (ox + x * sc), dpr * (oy + y * sc)];
      let kick = 0, last = null;
      window.__shot = () => {
        const S = B.S, base = 470 * sc * dpr;
        const now = { perfects: S.perfects, lives: S.lives, landed: S.landed };
        if (last && (now.perfects > last.perfects || now.lives < last.lives)) kick = 20;
        last = now;
        const z = kick-- > 0 ? 1.3 : 1;
        const [cx, cy] = px(200, 302), [fx, fy] = px(200, (S.top + 440) / 2 - 20);
        return __cam(cv, kick > 0 ? { z, x: fx, y: fy } : { z, x: cx, y: cy }, base, '#05040c');
      };
      return 1;
    })()`,
  },
  frame: { step: `__bot()`, shot: `__shot` },
  sub: 2, // its frames at 60 a second, so its own speed check never lowers the picture
  frames: 195,
};

// ⚖️ Tembleque, hard: the disc in 3D, its opening turn, then the bot moves each piece with the arrow keys and drops it
const HARD = {
  url: lang => `${SITE}/wobbles/hard/?test&res=2&seed=7&lang=${lang}`,
  width: 400, height: 560,
  storage: lang => ({ 'juegos-de-salon:lang': lang, 'balanza-lab:start-pieces': '5' }),
  start: `document.getElementById('cBtn').click(); 1`,
  setup: {
    ready: `window.__balanza.state === 'play' && window.__balanza.opening > 1.1`,
    bot: `(() => {
      const B = window.__balanza, cv = document.getElementById('cv');
      const key = (t, code) => window.dispatchEvent(new KeyboardEvent(t, { code, bubbles: true }));
      const down = new Set();
      const hold = codes => { for (const c of [...down]) if (!codes.includes(c)) { key('keyup', c); down.delete(c); } for (const c of codes) if (!down.has(c)) { key('keydown', c); down.add(c); } };
      // Which way each arrow moves the piece, measured on the first piece
      const dirs = {}, probe = ['ArrowRight', 'ArrowDown']; let at = null, n = 0, goal = null, wait = 0;
      window.__bot = () => {
        const S = B.S; if (!S || B.state !== 'play' || B.opening != null) { hold([]); return; }
        const t = B.target;
        if (probe.length) {
          if (!at) { at = { x: t.x, z: t.z, k: 0 }; hold([probe[0]]); return; }
          if (++at.k < 6) return;
          dirs[probe[0]] = [t.x - at.x, t.z - at.z]; probe.shift(); at = null; hold([]);
          if (!probe.length) { dirs.ArrowLeft = dirs.ArrowRight.map(v => -v); dirs.ArrowUp = dirs.ArrowDown.map(v => -v); }
          return;
        }
        if (!S.held) { goal = null; hold([]); return; }
        if (wait-- > 0) return;
        const pl = S.plat, R = B.RAD * 0.55;
        if (!goal) {
          n++;
          const cx = -pl.load[0] / (B.MASS * 1000) * 0.8, cz = -pl.load[2] / (B.MASS * 1000) * 0.8, a = n * 2.4;
          goal = { x: Math.max(-R, Math.min(R, cx + Math.cos(a) * R * 0.45)), z: Math.max(-R, Math.min(R, cz + Math.sin(a) * R * 0.45)) };
        }
        const dx = goal.x - t.x, dz = goal.z - t.z, d = Math.hypot(dx, dz);
        if (d < B.RAD * 0.05) { hold([]); key('keydown', 'Space'); key('keyup', 'Space'); goal = null; wait = 10; return; }
        hold(Object.entries(dirs).filter(([, v]) => (v[0] * dx + v[1] * dz) / Math.hypot(...v) > d * 0.38).map(([c]) => c));
      };
      let kick = 0, last = null;
      window.__shot = () => {
        const S = B.S, W = cv.width, H = cv.height;
        if (last != null && S.score > last) kick = 18;
        last = S.score;
        const z = kick-- > 0 ? 1.55 : 1.3;
        return __cam(cv, { z, x: W / 2, y: kick > 0 ? H * 0.62 : H * 0.56 }, W, '#07060f');
      };
      return 1;
    })()`,
  },
  frame: { step: `__bot()`, shot: `__shot` },
  sub: 2,
  frames: 200,
};

const enc = (dir, mp4) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '30', '-i', `${dir}/f%04d.jpg`,
  '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '29', '-preset', 'slow', '-movflags', '+faststart', '-an', mp4]);
const frameCount = dir => readdirSync(dir).filter(f => f.endsWith('.jpg')).length;
const run = async (G, lang, dir) => take({ ...G, url: G.url(lang), storage: G.storage(lang), dir });

mkdirSync(TMP, { recursive: true });
for (const lang of LANGS) {
  if (GAMES.includes('croc')) {
    const dir = `${TMP}/croc-${lang}`;
    const n = await run(CROC, lang, dir);
    enc(dir, join(DEST, `croc-${lang}.mp4`));
    if (lang === 'es') { copyFileSync(`${dir}/f0000.jpg`, join(DEST, 'croc-start.jpg')); copyFileSync(`${dir}/f${String(Math.floor(n * 0.55)).padStart(4, '0')}.jpg`, join(DEST, 'croc.jpg')); }
    console.log(`✓ croc ${lang}: ${n} frames`);
  }
  if (GAMES.includes('wobbles')) {
    const easy = `${TMP}/easy-${lang}`, hard = `${TMP}/hard-${lang}`;
    await run(EASY, lang, easy); await run(HARD, lang, hard);
    enc(easy, `${TMP}/easy-${lang}.mp4`); enc(hard, `${TMP}/hard-${lang}.mp4`);
    // Easy, then a zoom into hard (half a second)
    const cut = (frameCount(easy) / 30 - 0.5).toFixed(3);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', `${TMP}/easy-${lang}.mp4`, '-i', `${TMP}/hard-${lang}.mp4`,
      '-filter_complex', `[0][1]xfade=transition=zoomin:duration=0.5:offset=${cut},format=yuv420p`,
      '-c:v', 'libx264', '-crf', '29', '-preset', 'slow', '-movflags', '+faststart', '-an', join(DEST, `wobbles-${lang}.mp4`)]);
    if (lang === 'es') { copyFileSync(`${easy}/f0000.jpg`, join(DEST, 'wobbles-start.jpg')); copyFileSync(`${hard}/f${String(frameCount(hard) - 1).padStart(4, '0')}.jpg`, join(DEST, 'wobbles.jpg')); }
    console.log(`✓ wobbles ${lang}`);
  }
}
process.exit(0);
