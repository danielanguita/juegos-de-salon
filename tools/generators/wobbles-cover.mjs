// ⚖️ Tembleque's cover picture (the owner's request, 2026-11-21): each level as it really plays, recorded from
// the real game, with a camera that breathes, follows each falling piece and punches in when it lands, and an
// endless loop: the camera ends where it began, pushed in on the plank, and the last 0.8 s melt into the first.
//
// It borrows the splash's takes (marketing/splash/croc-wobbles-clip.mjs: the virtual clock, the bots that play
// through the game's own input) and points its own 10:7 camera, the cover's box. The words the game writes on
// its canvas (¡CLAVADO!, NUEVA: LADRILLO) are left out of the take, so one clip per level serves every language.
//
//   python3 -m http.server 8793 -d public &
//   SITE=http://localhost:8793 node tools/generators/wobbles-cover.mjs [easy|hard]
//
// Output, in public/wobbles/cover/: easy.mp4 and hard.mp4 (600×420, 30 fps, muted, looping), and easy.jpg and
// hard.jpg, each loop's first frame: the poster while the clip loads and the still for reduced motion.
import { mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { take, EASY, HARD } from '../../marketing/splash/croc-wobbles-clip.mjs';

const SITE = process.env.SITE || 'http://localhost:8793';
const DEST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'wobbles', 'cover');
const TMP = '/tmp/wobbles-cover';
const OW = 600, OH = 420; // the cover's box, 10:7
const FPS = 30, FRAMES = 330, BLEND = 24; // an 10.2 s loop; its seam is a 0.8 s crossfade

// No words on the canvas (one clip for every language); emoji and digits stay
const NO_WORDS = `(() => {
  const P = CanvasRenderingContext2D.prototype;
  for (const fn of ['fillText', 'strokeText']) { const f = P[fn]; P[fn] = function (s, ...a) { if (/\\p{L}/u.test(String(s))) return; return f.call(this, s, ...a); }; }
})();`;

// The cover's camera: a 10:7 window of the canvas, `z` times closer than `base` wide, centred on (x, y), eased.
// `loop(f)` pushes it in over the first and last BLEND frames, so the seam joins two shots framed alike.
const CAMERA = `(() => {
  const out = document.createElement('canvas'); out.width = ${OW}; out.height = ${OH};
  const o = out.getContext('2d'); o.imageSmoothingQuality = 'high';
  let cur = null, f = 0;
  window.__loop = () => { const e = x => x * x * (3 - 2 * x); const a = Math.max(0, 1 - f / ${BLEND}), b = Math.max(0, 1 - (${FRAMES} - 1 - f) / ${BLEND}); return 0.26 * e(Math.max(a, b)); };
  window.__breath = (amp, per) => amp * Math.sin(2 * Math.PI * f / per);
  window.__cam2 = (src, goal, base, bg) => {
    if (!cur) cur = { ...goal };
    for (const k of ['z', 'x', 'y']) cur[k] += (goal[k] - cur[k]) * (k === 'z' ? 0.14 : 0.12);
    const sw = Math.min(src.width, base / cur.z), sh = sw * ${OH / OW};
    // \`floor\`: the lowest canvas row that must stay in the window (the plank and its stand)
    const yy = goal.floor != null ? Math.max(cur.y, goal.floor - sh / 2) : cur.y;
    const x = Math.max(sw / 2, Math.min(src.width - sw / 2, cur.x)), y = Math.max(sh / 2, Math.min(src.height - sh / 2, yy));
    o.fillStyle = bg; o.fillRect(0, 0, ${OW}, ${OH});
    o.drawImage(src, x - sw / 2, y - sh / 2, sw, sh, 0, 0, ${OW}, ${OH});
    f++;
    return out.toDataURL('image/jpeg', 0.93);
  };
})();`;

// Easy: the whole plank with the claw above; it leans in after each falling piece and punches in as it lands
const EASY_CAM = `(() => {
  const B = window.__balanza, cv = document.getElementById('cv');
  const px = (x, y) => [dpr * (ox + x * sc), dpr * (oy + y * sc)];
  let punch = 0, at = [200, 400], last = null;
  window.__coverShot = () => {
    const S = B.S, base = 800 * sc * dpr; // wide: the claw's rail, whole, down to the plank's stand
    const fall = S.bodies.filter(b => !b.touch && b.vy > 40 && b.y > 60).at(-1);
    const now = { landed: S.landed, perfects: S.perfects };
    if (last && now.perfects > last.perfects) punch = 0.3;
    else if (last && now.landed > last.landed) punch = Math.max(punch, 0.18);
    if (last && now.landed > last.landed) { const b = S.bodies.at(-1); if (b) at = [b.x, b.y]; }
    last = now; punch *= 0.92;
    const top = Math.min(S.top ?? 440, 430), wide = [200, 230];
    let goal = fall ? { z: 1.15, w: [200 + (fall.x - 200) * 0.5, Math.max(250, (fall.y + top) / 2)] } : { z: 1, w: wide };
    if (punch > 0.03) goal = { z: 1.4 + punch, w: [200 + (at[0] - 200) * 0.6, at[1] - 10] };
    const l = __loop(); if (l > 0.01) goal = { z: goal.z + l, w: [200 + (goal.w[0] - 200) * (1 - l * 2.5), goal.w[1] + (top - 40 - goal.w[1]) * Math.min(1, l * 3)] };
    const [x, y] = px(goal.w[0] + __breath(6, 160), goal.w[1]);
    return __cam2(cv, { z: goal.z + __breath(0.04, 110), x, y, floor: px(200, 478)[1] }, base, '#05040c');
  };
  return 1;
})()`;

// Hard: the disc in 3D, swaying gently, pushed in on each piece that scores and on the seam
const HARD_CAM = `(() => {
  const B = window.__balanza, cv = document.getElementById('cv');
  let punch = 0, last = null;
  window.__coverShot = () => {
    const S = B.S, W = cv.width, H = cv.height;
    if (last != null && S.score > last) punch = 0.3;
    last = S.score; punch *= 0.92;
    const l = __loop();
    return __cam2(cv, { z: 1.02 + punch + l + __breath(0.04, 120), x: W / 2 + W * __breath(0.03, 165), y: H * (0.6 + punch * 0.06 + l * 0.06) }, W, '#07060f');
  };
  return 1;
})()`;

const LEVELS = {
  // Easy taken wider than the splash's, so the whole scene fits the cover's 10:7 box
  easy: { ...EASY, width: 820, setup: { ...EASY.setup, bot: `${EASY.setup.bot}; ${EASY_CAM}` } },
  hard: { ...HARD, setup: { ...HARD.setup, bot: `${HARD.setup.bot}; ${HARD_CAM}` } },
};

const only = process.argv.slice(2).filter(a => a in LEVELS);
mkdirSync(DEST, { recursive: true });
for (const level of only.length ? only : Object.keys(LEVELS)) {
  const G = LEVELS[level], dir = `${TMP}/${level}`;
  const n = await take({ ...G, url: G.url('es'), storage: G.storage('es'), dir, inject: NO_WORDS + CAMERA,
    frame: { step: G.frame.step, shot: '__coverShot' }, frames: FRAMES });
  if (n < FRAMES) throw new Error(`${level}: the take ended after ${n} frames, ${FRAMES} wanted`);
  // The loop: frames BLEND…end, whose last BLEND melt into frames 0…BLEND; it ends on frame BLEND-1, and starts on BLEND
  const d = BLEND / FPS, off = (n - 2 * BLEND) / FPS;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', `${dir}/f%04d.jpg`, '-filter_complex',
    `[0]split[s1][s2];[s1]trim=start_frame=${BLEND},setpts=PTS-STARTPTS[a];[s2]trim=end_frame=${BLEND},setpts=PTS-STARTPTS[b];` +
    `[a][b]xfade=transition=fade:duration=${d}:offset=${off},format=yuv420p`,
    '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-movflags', '+faststart', '-an', join(DEST, `${level}.mp4`)]);
  copyFileSync(`${dir}/f${String(BLEND).padStart(4, '0')}.jpg`, join(DEST, `${level}.jpg`));
  console.log(`✓ ${level}: ${readdirSync(dir).length} frames → ${(n - BLEND) / FPS} s loop`);
}
process.exit(0);
