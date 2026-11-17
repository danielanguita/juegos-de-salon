
/* ================================================================== */
/* The view: Babel's solid blocks in isometric view, sound, input      */
/* ================================================================== */
const $ = s => document.querySelector(s);
const DISPLAY = "Bangers, Impact, 'Arial Black', sans-serif", BODY = "Nunito, system-ui, -apple-system, sans-serif";
const VW = 400, VH = 600, C30 = 0.8660254037844386, NEON = [[255, 46, 136], [255, 122, 26], [255, 210, 63], [157, 255, 58], [46, 230, 214], [138, 77, 255]];
const rgb = ([r, g, b], a = 1) => `rgba(${r},${g},${b},${a})`;
const sombra = (col, k) => col.map(v => Math.round(v * k));
const claro = (col, k) => col.map(v => Math.round(v + (255 - v) * k));
const neonAt = k => { const i = Math.floor(k) % 6, f = k - Math.floor(k), a = NEON[i], b = NEON[(i + 1) % 6]; return a.map((v, j) => Math.round(v + (b[j] - v) * f)); };
const BASE_COLOR = [58, 20, 100], TRAY = [86, 44, 150], SHADOW = 'rgba(14,2,34,0.62)';
const cv = $('#cv');
/** `c` is the screen canvas, or for a moment a text sprite's while it is made. */
let c = cv.getContext('2d');
let dpr = 1, sc = 1, ox = 0, oy = 0, vw = 0, vh = 0, zoom = 1;
/* ---------- drawing speed (docs/games/wobbles-3d.md, "Performance") ----------
 * The canvas has at most 2 device pixels per CSS pixel (`RES`); `pace` lowers it to 1.5 and then 1 when
 * frames come slower than about 42 a second for two seconds while playing. Lab: `?res=3|2|1` fixes it. */
const qp = new URLSearchParams(location.search), RES_PARAM = Number(qp.get('res')) || 0;
let RES = RES_PARAM || 2;
function resize() {
  const r = cv.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, RES); vw = r.width; vh = r.height; TEXTS_DRAWN.clear(); heartsWere = '';
  cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  hv.width = Math.round(HEARTS_W * dpr); hv.height = Math.round(HEARTS_H * dpr);
  sc = Math.min(vw / VW, vh / VH); ox = (vw - VW * sc) / 2; oy = (vh - VH * sc) / 2;
}
/**
 * The camera, Babel's: seen from above and one side, x going right and down, z left and down, y up.
 * Here it also turns about the vertical: `yaw` is how far, and (c, s) its cosine and sine. `CAM` is
 * swapped to draw the small previews. The scene zooms about (200, ZY).
 */
const MAIN = { cx: 200, cy: 430, u: 122, c: 1, s: 0 }, ZY = 556;
let CAM = MAIN, yaw = 0;
const proj = (X, Y, Z) => { const x = X * CAM.c - Z * CAM.s, z = X * CAM.s + Z * CAM.c; return [CAM.cx + (x - z) * C30 * CAM.u, CAM.cy + (x + z) * 0.5 * CAM.u - Y * CAM.u]; };
/** How much a direction of the world looks at the camera: positive, it faces it. */
const facing = (x, y, z) => x * (CAM.c + CAM.s) + y + z * (CAM.c - CAM.s);
/** A step across the screen plane (right, toward the viewer), as a step over the world's ground. */
const ground = (xr, zr) => [xr * CAM.c + zr * CAM.s, zr * CAM.c - xr * CAM.s];
/** How many blurs were drawn (the lab's check: 0 a frame while playing; only text sprites, made once, have one). */
let blurs = 0;
/**
 * A glow without a blur: the path already made, stroked four times, each wider and fainter, before the line
 * or shape itself goes on top. `k`: how strong (the line's own alpha); `w`: the line's width.
 */
const GLOW = [[1, 0.04], [0.72, 0.06], [0.46, 0.09], [0.22, 0.13]];
function glowLine(color, blur, k = 1, w = c.lineWidth) {
  const b = blur / zoom, a = c.globalAlpha * k * (w > 0 ? Math.min(1, 1.6 * w / b) : 1);
  if (a < 0.004) return;
  c.save(); c.strokeStyle = color; c.lineJoin = 'round'; c.lineCap = 'round';
  for (const [r, f] of GLOW) { c.globalAlpha = a * f; c.lineWidth = w + 2 * b * r; c.stroke(); }
  c.restore();
}
/** A glowing text: drawn once with a real blur into a canvas of its own (only once the fonts are in), then only copied. */
const TEXTS_DRAWN = new Map();
let fontsIn = !document.fonts;
if (document.fonts) document.fonts.ready.then(() => { fontsIn = true; TEXTS_DRAWN.clear(); });
function glowText(s, x, y, size, color, blur) {
  const k = dpr * sc, key = `${s}|${size}|${color}|${blur}|${k.toFixed(2)}`;
  let t = TEXTS_DRAWN.get(key);
  if (!t) {
    const font = `${size}px ${DISPLAY}`; c.font = font;
    const pad = blur * 1.5 + 3, w = c.measureText(s).width + 2 * pad, h = size * 1.4 + 2 * pad, el = document.createElement('canvas');
    el.width = Math.ceil(w * k); el.height = Math.ceil(h * k);
    const main = c; c = el.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0); c.shadowColor = color; c.shadowBlur = blur * k; blurs++;
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(s, w / 2, h / 2);
    c = main;
    t = { el, w, h };
    if (fontsIn) { if (TEXTS_DRAWN.size > 120) TEXTS_DRAWN.clear(); TEXTS_DRAWN.set(key, t); }
  }
  c.drawImage(t.el, x - t.w / 2, y - t.h / 2, t.w, t.h);
}
/**
 * A soft shadow in the shape of the path that `trace` draws: the shape itself is drawn far off the
 * canvas and only its blurred shadow lands in place (the one blur every browser's canvas has). What it
 * may fall on is whatever clip is set.
 */
let shadowAlpha = 1;   // how much of the shadow shows (it fades in with the piece that casts it)
/** The shadow without a blur: the shape filled, with its edge softened by wide faint strokes (a blur here cost most of a phone's frame). */
function softShadow(trace) {
  c.save(); c.globalAlpha *= shadowAlpha; c.beginPath(); trace(); c.closePath();
  const a = c.globalAlpha; c.fillStyle = c.strokeStyle = SHADOW; c.lineJoin = 'round';
  c.globalAlpha = a * 0.62; c.fill();
  c.globalAlpha = a * 0.3; c.lineWidth = 5 / zoom; c.stroke();
  c.globalAlpha = a * 0.14; c.lineWidth = 11 / zoom; c.stroke();
  c.restore();
}
function poly(pts, fill) { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } }
function txt(s, x, y, size, color = '#fff', body = false, align = 'center') {
  c.font = body ? `900 ${size}px ${BODY}` : `${size}px ${DISPLAY}`;
  c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(s, x, y);
}

/**
 * The light: above, and more from the viewer's right than from the left, as on Babel's slabs. It goes
 * around with the camera, so whichever side is looked at is lit the same way.
 */
const LX = 0.464, LY = 0.877, LZ = 0.124;
const lit = (nx, ny, nz) => 0.47 + 0.68 * Math.max(0, (nx * CAM.c - nz * CAM.s) * LX + ny * LY + (nx * CAM.s + nz * CAM.c) * LZ);
const tint = (col, s) => (s <= 1 ? sombra(col, s) : claro(col, Math.min(1, (s - 1) * 1.5)));
/**
 * A solid: its faces that look at the camera, each shaded by where it looks, with a lighter line around.
 * One cube of a piece made of blocks leaves out the faces it shares with the next cube (`hide`) and the
 * lines where two cubes meet flat (`seams`), so the piece reads as one.
 * `cast`: the shadow of the piece in hand, which every face under it that looks up receives.
 */
function drawSolid(b, col, { alpha = 1, dim = 1, line = 0.55, fill = 1 } = {}, cast = null) {
  const sh = b.shape, C = CAM, kx = C30 * C.u, ky = 0.5 * C.u, at = b.seams ? [] : null;
  const under = cast && b.miny < cast.y && !(b.maxx < cast.x0 || b.minx > cast.x1 || b.maxz < cast.z0 || b.minz > cast.z1);
  c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = 1 / zoom;
  for (let i = 0; i < sh.faces.length; i++) {
    const nx = b.nx[i], ny = b.ny[i], nz = b.nz[i];
    if ((b.hide && b.hide[i]) || facing(nx, ny, nz) <= 1e-6) continue;
    const f = sh.faces[i], path = new Path2D();
    for (let k = 0; k < f.length; k++) {
      const v = f[k], x = b.px[v] * C.c - b.pz[v] * C.s, z = b.px[v] * C.s + b.pz[v] * C.c, sx = C.cx + (x - z) * kx, sy = C.cy + (x + z) * ky - b.py[v] * C.u;
      if (k) path.lineTo(sx, sy); else path.moveTo(sx, sy);
      if (at) { at[2 * k] = sx; at[2 * k + 1] = sy; }
    }
    path.closePath();
    c.fillStyle = rgb(tint(col, lit(nx, ny, nz) * dim), alpha * fill); c.fill(path);
    if (under && ny > 0.08) {
      // The shadow falls straight down: its outline, laid on this face's plane and cut to the face
      const v = f[0], d = nx * b.px[v] + ny * b.py[v] + nz * b.pz[v];
      c.save(); c.clip(path);
      softShadow(() => { for (const hull of cast.hulls) { hull.forEach(([x, z], k) => { const p = proj(x, (d - nx * x - nz * z) / ny, z); if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); } });
      c.restore();
    }
    if (!line) continue;
    c.strokeStyle = rgb(claro(col, 0.6), alpha * line);
    if (!at) { c.stroke(path); continue; }
    c.beginPath();
    for (let k = 0; k < f.length; k++) if (!b.seams[i][k]) { const j = (k + 1) % f.length; c.moveTo(at[2 * k], at[2 * k + 1]); c.lineTo(at[2 * j], at[2 * j + 1]); }
    c.stroke();
  }
}
/** A ball: a lit disc, with three pairs of dots that turn with it, so it is seen to roll. */
function drawBall(b, col, { alpha = 1, dim = 1 } = {}) {
  const [x, y] = proj(b.x, b.y, b.z), rad = b.shape.r, R = rad * CAM.u, g = c.createRadialGradient(x + R * 0.2, y - R * 0.42, R * 0.05, x, y, R);
  g.addColorStop(0, rgb(tint(col, 1.5 * dim), alpha)); g.addColorStop(0.55, rgb(tint(col, 0.98 * dim), alpha)); g.addColorStop(1, rgb(tint(col, 0.52 * dim), alpha));
  c.beginPath(); c.arc(x, y, R, 0, 7); c.fillStyle = g; c.fill();
  c.fillStyle = rgb(sombra(col, 0.42 * dim), 0.8 * alpha);
  for (let j = 0; j < 3; j++) for (const s of [1, -1]) {
    const vx = s * b.r[j], vy = s * b.r[3 + j], vz = s * b.r[6 + j];
    if (facing(vx, vy, vz) <= 0.35) continue;
    const [dx, dy] = proj(b.x + vx * rad * 0.94, b.y + vy * rad * 0.94, b.z + vz * rad * 0.94);
    c.beginPath(); c.arc(dx, dy, R * 0.13, 0, 7); c.fill();
  }
  c.lineWidth = 1 / zoom; c.strokeStyle = rgb(claro(col, 0.6), 0.55 * alpha); c.beginPath(); c.arc(x, y, R, 0, 7); c.stroke();
}
/** One of the solids a piece is drawn with (a ball does not take the shadow of the piece in hand: it is too small to tell). */
function drawPiece(kind, b, o = {}, cast = null) {
  if (b.shape.ball) drawBall(b, KINDS[kind].color, o); else drawSolid(b, KINDS[kind].color, o, cast);
}
/** A solid's outline seen from straight above: the convex hull of its corners over the ground, as [x, z] (a ball's: a circle). */
function outline(b) {
  if (b.shape.ball) return ROUND.filter((_, i) => i % 2 === 0).map(([co, si]) => [b.x + co * b.shape.r, b.z + si * b.shape.r]);
  const pts = b.px.map((x, i) => [x, b.pz[i]]).sort((p, q) => p[0] - q[0] || p[1] - q[1]), out = [];
  const left = (o, a, p) => (a[0] - o[0]) * (p[1] - o[1]) - (a[1] - o[1]) * (p[0] - o[0]) <= 1e-12;
  for (const p of pts) { while (out.length >= 2 && left(out[out.length - 2], out[out.length - 1], p)) out.pop(); out.push(p); }
  const base = out.length + 1;
  for (let i = pts.length - 2; i >= 0; i--) { while (out.length >= base && left(out[out.length - 2], out[out.length - 1], pts[i])) out.pop(); out.push(pts[i]); }
  out.pop();
  return out;
}

/** The outline on screen of a piece's solids, as one path: the convex hull of each solid's corners (a ball: its circle). */
function silhouette(looks) {
  c.beginPath();
  for (const b of looks) {
    if (b.shape.ball) { const [x, y] = proj(b.x, b.y, b.z), R = b.shape.r * CAM.u; c.moveTo(x + R, y); c.arc(x, y, R, 0, 7); continue; }
    const pts = b.px.map((_, i) => proj(b.px[i], b.py[i], b.pz[i])).sort((p, q) => p[0] - q[0] || p[1] - q[1]), out = [];
    const turn = (o, a, p) => (a[0] - o[0]) * (p[1] - o[1]) - (a[1] - o[1]) * (p[0] - o[0]) <= 0;
    for (const p of pts) { while (out.length >= 2 && turn(out[out.length - 2], out[out.length - 1], p)) out.pop(); out.push(p); }
    const base = out.length + 1;
    for (let i = pts.length - 2; i >= 0; i--) { while (out.length >= base && turn(out[out.length - 2], out[out.length - 1], pts[i])) out.pop(); out.push(pts[i]); }
    out.pop();
    out.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
  }
}
/**
 * The order to paint the solids in, far to near. Two convex solids that do not overlap are parted by a
 * plane, and the physics' own test gives it (`meets`: the separating axis, or for a ball the line to its
 * centre): the one on the camera's side of it goes later. Only pairs that overlap on screen matter. If
 * the rules ever make a ring, the furthest goes first.
 */
function paintOrder(items) {
  const n = items.length, next = items.map(() => []), deg = new Array(n).fill(0), out = [], C = CAM;
  for (const it of items) {
    const b = it.b; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    if (b.shape.ball) { const xr = b.x * C.c - b.z * C.s, zr = b.x * C.s + b.z * C.c, x = xr - zr, y = (xr + zr) * 0.5 - b.y, r = b.shape.r; x0 = x - 1.42 * r; x1 = x + 1.42 * r; y0 = y - 1.23 * r; y1 = y + 1.23 * r; }
    else for (let i = 0; i < b.px.length; i++) {
      const xr = b.px[i] * C.c - b.pz[i] * C.s, zr = b.px[i] * C.s + b.pz[i] * C.c, x = xr - zr, y = (xr + zr) * 0.5 - b.py[i];
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    it.x0 = x0; it.x1 = x1; it.y0 = y0; it.y1 = y1; it.depth = facing(b.x, b.y, b.z);
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const p = items[i], q = items[j];
    if (p.x1 < q.x0 || q.x1 < p.x0 || p.y1 < q.y0 || q.y1 < p.y0) continue;
    meets(p.b, q.b);
    const d = facing(sX, sY, sZ);
    if (d > 1e-4) { next[i].push(j); deg[j]++; } else if (d < -1e-4) { next[j].push(i); deg[i]++; }
  }
  const left = new Set(items.keys());
  while (left.size) {
    let pick = -1, far = -1;
    for (const i of left) { if (far < 0 || items[i].depth < items[far].depth) far = i; if (deg[i] <= 0 && (pick < 0 || items[i].depth < items[pick].depth)) pick = i; }
    if (pick < 0) pick = far;
    left.delete(pick); out.push(items[pick]);
    for (const j of next[pick]) deg[j]--;
  }
  return out;
}

/* ---------- the disc, drawn round (the physics has it with 24 sides) ---------- */
const ROUND = Array.from({ length: 48 }, (_, i) => [Math.cos(i * Math.PI / 24), Math.sin(i * Math.PI / 24)]);
let discY = 0;   // how far the disc has dropped from its pivot (only once it has gone over)
const onDisc = (r, x, y, z) => proj(r[0] * x + r[1] * y + r[2] * z, discY + r[3] * x + r[4] * y + r[5] * z, r[6] * x + r[7] * y + r[8] * z);
function circlePath(r, rad, y) { c.beginPath(); for (let i = 0; i < 48; i++) { const p = onDisc(r, ROUND[i][0] * rad, y, ROUND[i][1] * rad); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); } c.closePath(); }
/** The direction in the world of the disc's own (x, 0, z). */
const outward = (r, x, z) => [r[0] * x + r[2] * z, r[3] * x + r[5] * z, r[6] * x + r[8] * z];
function drawDisc(pl, level, cast) {
  const r = pl.r;
  for (let i = 0; i < 48; i++) {
    const [c0, s0] = ROUND[i], [c1, s1] = ROUND[(i + 1) % 48], n = outward(r, (c0 + c1) / 2, (s0 + s1) / 2);
    if (facing(n[0], n[1], n[2]) <= 0) continue;
    poly([onDisc(r, c0 * RAD, 0, s0 * RAD), onDisc(r, c1 * RAD, 0, s1 * RAD), onDisc(r, c1 * RAD, -TH, s1 * RAD), onDisc(r, c0 * RAD, -TH, s0 * RAD)], rgb(sombra(TRAY, lit(n[0], n[1], n[2]) * 0.9)));
  }
  // Lighter at the back, whichever way the camera looks
  const [bx, bz] = ground(-0.7, -0.7), a = onDisc(r, bx, 0, bz), b = onDisc(r, -bx, 0, -bz), g = c.createLinearGradient(a[0], a[1], b[0], b[1]);
  g.addColorStop(0, rgb(claro(TRAY, 0.34))); g.addColorStop(1, rgb(claro(TRAY, 0.04)));
  circlePath(r, RAD, 0); c.fillStyle = g; c.fill();
  // Rings and a cross to aim by
  c.lineWidth = 1 / zoom; c.strokeStyle = 'rgba(255,255,255,0.13)';
  for (const rad of [0.33 * RAD, 0.66 * RAD]) { circlePath(r, rad, 0); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,0.2)'; c.beginPath();
  c.moveTo(...onDisc(r, -RAD + RIM_W, 0, 0)); c.lineTo(...onDisc(r, RAD - RIM_W, 0, 0)); c.moveTo(...onDisc(r, 0, 0, -RAD + RIM_W)); c.lineTo(...onDisc(r, 0, 0, RAD - RIM_W)); c.stroke();
  if (cast) {
    // The shadow on the disc itself: the outline laid on its leaning plane
    c.save(); circlePath(r, RAD - RIM_W, 0); c.clip();
    softShadow(() => { for (const hull of cast.hulls) { hull.forEach(([x, z], k) => { const p = proj(x, -(pl.ux * x + pl.uz * z) / pl.uy, z); if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); } });
    c.restore();
  }
  const col = level ? '#9dff3a' : '#ffffff';
  circlePath(r, 0.05, 0); c.lineWidth = 0; glowLine(col, level ? 14 : 5, 1, 0); c.fillStyle = col; c.fill();
}
/**
 * The level ring: a hoop around the disc that never leans, at the height of the wall's top when the disc
 * is level. A leaning disc dips under it on its heavy side and rises over it on the other, so how far
 * off it is, and which way, shows from any side; a pink mark joins the hoop to the wall where the disc
 * is lowest. Level, the wall's edge sits on the hoop and both light up green (the 2D plank's green knob).
 * Drawn in two halves: the one behind the pile, and the one in front of it.
 */
function levelRing(pl, front) {
  if (S.capsized) return;
  const r = pl.r, rr = RAD + 0.05, a = Math.min(1, verde), lean = Math.sqrt(pl.ux * pl.ux + pl.uz * pl.uz);
  // Close to going over, the hoop turns pink and beats
  const danger = Math.max(0, Math.min(1, (lean - 0.26) / 0.14)), beat = danger * (0.6 + 0.4 * Math.sin(clock * 14));
  const half = fn => { c.beginPath(); for (let i = 0; i < 48; i++) { const [c0, s0] = ROUND[i], [c1, s1] = ROUND[(i + 1) % 48]; if ((facing(c0 + c1, 0, s0 + s1) > 0) === front) { c.moveTo(...fn(c0, s0)); c.lineTo(...fn(c1, s1)); } } };
  c.lineCap = 'round';
  // The hoop
  half((co, si) => proj(co * rr, RIM, si * rr));
  if (danger > 0) { c.strokeStyle = `rgba(255,46,136,${0.3 + 0.45 * beat})`; c.lineWidth = (1.1 + 1.2 * beat) / zoom; glowLine('#ff2e88', 3 + 7 * beat, 0.3 + 0.45 * beat); c.stroke(); }
  else {
    c.strokeStyle = rgb([255, 255, 255].map((v, k) => Math.round(v + ([190, 255, 120][k] - v) * a)), 0.2 + 0.4 * a); c.lineWidth = (1.1 + 0.5 * a) / zoom;
    if (a > 0.03) glowLine('#9dff3a', 3 + 4 * a, 0.2 + 0.4 * a); c.stroke();
  }
  // Level: the wall's edge lights up green too
  if (a > 0.03) { half((co, si) => onDisc(r, co * RAD, RIM, si * RAD)); c.lineWidth = (1.4 + Math.max(0, verde - 1) * 1.6) / zoom; glowLine('#9dff3a', 4 + 5 * a, 0.55 * a); c.strokeStyle = `rgba(190,255,120,${0.55 * a})`; c.stroke(); }
  // Not level: where the disc is lowest, a pink mark from the hoop down to the wall, longer the more it leans
  if (lean > PERFECT && S.phase === 'play') {
    const dx = pl.ux / lean, dz = pl.uz / lean;
    if ((facing(dx, 0, dz) > 0) === front) {
      const p = proj(dx * rr, RIM, dz * rr), q = onDisc(r, dx * rr, RIM, dz * rr), k = Math.min(1, (lean - PERFECT) / 0.08 + 0.35);
      c.lineWidth = 2 / zoom; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); glowLine('#ff2e88', 4, 0.7 * k); c.strokeStyle = `rgba(255,46,136,${0.7 * k})`; c.stroke();
      c.beginPath(); c.arc(q[0], q[1], 3.2 / zoom, 0, 7); glowLine('#ff2e88', 4, 0.7 * k, 0); c.fillStyle = `rgba(255,46,136,${0.7 * k})`; c.fill();
    }
  }
}

/* ---------- effects (only what is seen: they never touch the game) ---------- */
let S = null, state = 'ready', acc = 0, clock = 0;
let chispas = [], anillos = [], floats = [], says = [], banner = null, shake = 0, verde = 0;
const STARS = Array.from({ length: 70 }, (_, i) => { const n = k => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); }; return { x: -400 + n(1) * 1200, y: -60 + n(2) * 520, r: 0.5 + n(3) * 1.1, f: 0.6 + n(4) * 2, p: n(5) * 6 }; });
function sparks(x, y, z, n, colors, speed = 0.9) {
  for (let k = 0; k < n; k++) { const a = (k / n) * 6.2832 + Math.random(); chispas.push({ x, y, z, vx: Math.cos(a) * speed, vy: 1.1 + (k % 3) * 0.45, vz: Math.sin(a) * speed, t: 0, color: colors[k % colors.length] }); }
}
const say = (text, color = '#ffd23f', size = 34) => { says = says.filter(s => s.t < 0.4); says.push({ text, color, size, t: 0 }); };

/*__SOUND__*/
/** What the game says happened, turned into light and sound. */
function onEvent(e) {
  if (e.type === 'drop') { SFX.drop(); if (e.auto) say(ui('b3Auto'), '#ffd23f', 26); }
  else if (e.type === 'hit') { sparks(e.x, e.y, e.z, 6, [KINDS[e.kind].color], 0.6); SFX.hit(e.m); }
  else if (e.type === 'score') {
    floats.push({ x: e.x, y: e.y + 0.12, z: e.z, text: `+${1 + e.bonus}`, color: e.perfect ? '#9dff3a' : '#ffd23f', t: 0 });
    if (e.perfect) {
      say(`${e.streak > 1 ? ui('b3Streak', { n: e.streak }) : ui('b3Perfect')}  +${1 + e.bonus}`, '#9dff3a'); SFX.perfect(e.streak); anillos.push({ t: 0 }); verde = 2;
      // Sparks all around the rim, in the house's colors
      const r = S.plat.r;
      for (let k = 0; k < 16; k++) { const co = ROUND[k * 3][0] * RAD, si = ROUND[k * 3][1] * RAD; sparks(r[0] * co + r[2] * si, r[3] * co + r[5] * si + RIM, r[6] * co + r[8] * si, 1, [k % 2 ? [157, 255, 58] : NEON[k % 6]], 0.5); }
    } else SFX.tick();
  } else if (e.type === 'warn') { says = []; say(ui('b3Tipping'), '#ff2e88', 30); SFX.tick(); if (navigator.vibrate) navigator.vibrate(30); }
  else if (e.type === 'capsize') { shake = 0.6; says = []; say(ui('b3Tipped'), '#ff2e88', 46); SFX.over(); if (navigator.vibrate) navigator.vibrate(120); }
  else if (e.type === 'fall') {
    if (e.counts) SFX.fall();
    if (e.over) { shake = 0.5; says = []; say(ui('b3Over'), '#ff2e88', 44); SFX.over(); if (navigator.vibrate) navigator.vibrate(90); }
    else if (e.counts) { shake = 0.35; says = []; say(ui(e.lives === 1 ? 'b3LastLife' : 'b3Fell'), '#ff2e88', 30); if (navigator.vibrate) navigator.vibrate(60); }
  } else if (e.type === 'debut') { banner = { kind: e.kind, t: 0 }; SFX.round(); }
}
function fx(dt) {
  for (const s of chispas) { s.t += dt; s.vy -= 6 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; }
  chispas = chispas.filter(s => s.t < 0.7);
  for (const a of anillos) a.t += dt; anillos = anillos.filter(a => a.t < 0.6);
  for (const f of floats) f.t += dt; floats = floats.filter(f => f.t < 0.9);
  for (const s of says) s.t += dt; says = says.filter(s => s.t < 1.3);
  if (banner && (banner.t += dt) > 2.4) banner = null;
  shake = Math.max(0, shake - dt);
  // The green light of a level disc (the 2D plank's knob): it comes on and goes off softly, and a perfect drop flares it
  if (S) { const pl = S.plat, on = S.phase === 'play' && pl.ux * pl.ux + pl.uz * pl.uz < PERFECT * PERFECT ? 1 : 0; verde += (on - verde) * Math.min(1, dt * (verde > 1 ? 3 : 8)); }
  // The camera pulls back as the pile grows, so the piece in hand stays in sight
  if (S) { const top = MAIN.cy - (S.hover + 0.65) * MAIN.u - 0.71 * RAD * MAIN.u; zoom += (Math.max(0.4, Math.min(1, (ZY - 50) / (ZY - top))) - zoom) * Math.min(1, dt * 4); }
}

/* ---------- the scene ---------- */
/** The piece in hand: a body of the view's own, placed each frame from the game's, and the shadow it casts (the outline of each solid it is drawn with). */
let hand = null, handOf = null, handAt = 0;
const ENTER_S = 0.45;
function holdPiece() {
  const h = S.held;
  if (h !== handOf) { handOf = h; hand = mkBody(-1, h.form, 0, 0, 0); handAt = S.t; }
  // It comes in softly: it fades in while it settles the last bit down into the hand (by the game's clock, so a pause holds it)
  const k = Math.min(1, (S.t - handAt) / ENTER_S), a = 1 - (1 - k) * (1 - k);
  hand.x = h.x; hand.y = S.hover + (1 - a) * 0.3; hand.z = h.z; hand.qw = h.qw; hand.qx = h.qx; hand.qy = h.qy; hand.qz = h.qz; place(hand);
  return { hulls: hand.looks.map(outline), x0: hand.minx, x1: hand.maxx, z0: hand.minz, z1: hand.maxz, y: hand.miny, a };
}
/** The dial at the bottom that turns the view: where it is (x0 to x1, `h` tall, 8 above the bottom) and how far a pixel turns. */
const DIAL = { x0: 56, x1: 344, h: 36, gain: 0.012 };
function drawDial(bottom) {
  const y0 = bottom - 8 - DIAL.h, mid = y0 + DIAL.h / 2, on = !!(turning || twist || opening != null);
  c.fillStyle = on ? 'rgba(46,230,214,0.18)' : 'rgba(0,0,0,0.32)'; c.strokeStyle = on ? 'rgba(46,230,214,0.7)' : 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
  c.beginPath(); c.roundRect(DIAL.x0, y0, DIAL.x1 - DIAL.x0, DIAL.h, DIAL.h / 2); c.fill(); c.stroke();
  // A mark every 15°, in the rim's colors, that slides with the turn
  c.save(); c.beginPath(); c.rect(DIAL.x0 + 34, y0, DIAL.x1 - DIAL.x0 - 68, DIAL.h); c.clip();
  const k0 = Math.round(yaw / 0.2618);
  for (let k = k0 - 6; k <= k0 + 6; k++) {
    const x = 200 - (yaw - k * 0.2618) / DIAL.gain, big = k % 6 === 0, hh = big ? 11 : 6;
    c.globalAlpha = Math.max(0, 1 - Math.abs(x - 200) / 110);
    c.strokeStyle = rgb(neonAt((((k % 24) + 24) % 24) / 4)); c.lineWidth = big ? 3 : 2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, mid - hh); c.lineTo(x, mid + hh); c.stroke();
  }
  c.restore(); c.globalAlpha = 1;
  txt('⟲', DIAL.x0 + 18, mid + 1, 17, 'rgba(255,255,255,0.8)', true); txt('⟳', DIAL.x1 - 18, mid + 1, 17, 'rgba(255,255,255,0.8)', true);
  return y0;
}
const previews = new WeakMap();
function render() {
  MAIN.c = Math.cos(yaw); MAIN.s = Math.sin(yaw);
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
  c.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * ox, dpr * oy);
  const L0 = -ox / sc, R0 = (vw - ox) / sc, T0 = -oy / sc, B0 = (vh - oy) / sc, t = clock;
  // The stars in five fills, one per level of brightness, not one each
  c.fillStyle = '#fff';
  for (let lv = 0; lv < 5; lv++) {
    c.beginPath();
    for (const s of STARS) { if (Math.min(4, Math.floor(Math.sin(t * s.f + s.p) ** 2 * 5)) !== lv) continue; c.moveTo(s.x + s.r, s.y); c.arc(s.x, s.y, s.r, 0, 7); }
    c.globalAlpha = 0.3 + 0.4 * (lv + 0.5) / 5; c.fill();
  }
  c.globalAlpha = 1;
  if (!S) return;
  const pl = S.plat, level = pl.ux * pl.ux + pl.uz * pl.uz < PERFECT * PERFECT;
  CAM = MAIN; discY = pl.y;
  // The whole scene is drawn through the camera, which zooms about a point near the bottom
  c.save(); c.translate(200, ZY); c.scale(zoom, zoom); c.translate(-200, -ZY);
  // The opening: the camera comes down on the board from far above it, and goes once around it as it arrives
  const zoomWas = zoom, ok = opening == null ? 1 : Math.min(1, opening / OPENING_S);
  if (ok < 1) { const u = 1 - Math.min(1, ok / 0.75), near = 1 - u * u * u, a = 0.26 + 0.74 * near; c.translate(MAIN.cx, MAIN.cy - 190 * (1 - near)); c.scale(a, a); c.translate(-MAIN.cx, -MAIN.cy); zoom *= a; }
  if (shake > 0) c.translate((Math.random() - 0.5) * 14 * shake / 0.5, (Math.random() - 0.5) * 14 * shake / 0.5);

  // A soft light around the disc (green while it is level), and Babel's column under it, fading into the night
  const g1 = 0.55 * Math.min(1, verde), hc = [138, 77, 255].map((v, i) => Math.round(v + ([157, 255, 58][i] - v) * g1)), halo = c.createRadialGradient(MAIN.cx, MAIN.cy, 10, MAIN.cx, MAIN.cy, 250);
  halo.addColorStop(0, rgb(hc, 0.3 + 0.04 * verde)); halo.addColorStop(1, rgb(hc, 0));
  c.fillStyle = halo; c.fillRect(MAIN.cx - 260, MAIN.cy - 260, 520, 520);
  {
    const w = 0.2, y1 = -0.34, y0 = -3.6, tip = proj(0, -TH, 0);
    for (const [nx, nz, a, b] of [[1, 0, [w, -w], [w, w]], [-1, 0, [-w, w], [-w, -w]], [0, 1, [-w, w], [w, w]], [0, -1, [w, -w], [-w, -w]]]) {
      if (facing(nx, 0, nz) <= 0) continue;
      const k = lit(nx, 0, nz) * 1.3, top = proj(a[0], y1, a[1])[1], bot = proj(a[0], y0, a[1])[1], g = c.createLinearGradient(0, top, 0, bot);
      g.addColorStop(0, rgb(sombra(BASE_COLOR, k))); g.addColorStop(1, rgb(sombra(BASE_COLOR, k), 0));
      poly([proj(a[0], y0, a[1]), proj(b[0], y0, b[1]), proj(b[0], y1, b[1]), proj(a[0], y1, a[1])], g);
      // The point the disc rests on
      poly([proj(a[0], y1, a[1]), proj(b[0], y1, b[1]), tip], rgb(sombra(claro(BASE_COLOR, 0.25), k)));
    }
  }

  // The disc, its wall, the pile, the pieces in the air and the piece in hand, far to near; the piece in hand casts its shadow on the rest
  const cast = S.held ? holdPiece() : null;
  shadowAlpha = cast ? cast.a : 1;
  levelRing(pl, false);
  const items = [{ b: pl.disc, disc: true }];
  for (const q of pl.parts) if (q.wall != null) items.push({ b: q, wall: q.wall });
  for (const q of pl.looks) items.push({ b: q, kind: q.kind, o: { dim: 0.82 } });
  for (const b of S.bodies) { const o = { alpha: b.lost ? Math.max(0, Math.min(1, 1 + (b.y - FALL_Y) / 2.5)) : 1 }; for (const q of b.looks) items.push({ b: q, kind: b.kind, o }); }
  if (S.held) for (const q of hand.looks) items.push({ b: q, kind: S.held.spec.kind, held: true });
  let haloDone = false;
  for (const it of paintOrder(items)) {
    if (it.disc) {
      drawDisc(pl, level, cast);
      // A perfect drop, as in Babel: a glowing outline that opens around the disc
      for (const a of anillos) { const k = a.t / 0.6; circlePath(pl.r, RAD + 0.03 + k * 0.3, 0); c.lineWidth = 3.5 / zoom; glowLine('#9dff3a', 16, 1 - k); c.strokeStyle = `rgba(210,255,160,${1 - k})`; c.stroke(); }
    } else if (it.wall != null) drawSolid(it.b, neonAt(it.wall / 4), { line: 0 }, cast);
    else if (it.held) {
      // Its glow: the outline of the whole piece, once, under its first solid
      if (!haloDone) { haloDone = true; silhouette(hand.looks); c.lineWidth = 0; glowLine(rgb(KINDS[it.kind].color), 10, (hand.looks.length > 1 ? 0.45 : 0.8) * cast.a, 0); }
      drawPiece(it.kind, it.b, { alpha: cast.a });
    }
    else drawPiece(it.kind, it.b, it.o, cast);
  }
  levelRing(pl, true);

  if (S.held) {
    // Its time: a ring over it that runs out
    const h = S.held, f = Math.max(0, h.fuse / h.hold), hurry = h.fuse < 1.2;
    c.globalAlpha = cast.a;
    const [fx_, fy] = proj(h.x, hand.maxy + 0.16, h.z), fc = hurry ? '#ff2e88' : '#ffd23f', fr = (9 + (hurry ? Math.sin(t * 22) : 0)) / zoom;
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 3 / zoom; c.beginPath(); c.arc(fx_, fy, fr, 0, 7); c.stroke();
    c.lineWidth = 3 / zoom; c.lineCap = 'round'; c.beginPath(); c.arc(fx_, fy, fr, -1.5708, -1.5708 + 6.2832 * f); glowLine(fc, 8); c.strokeStyle = fc; c.stroke();
    c.globalAlpha = 1;
    if (drag && drag.grab && !drag.twisted) {
      // Being turned: a ball of hoops around the piece: it goes all the way round, every way
      const [gx, gy] = proj(h.x, (hand.miny + hand.maxy) / 2, h.z), R = hand.form.r * MAIN.u + 9, col = rgb(KINDS[h.spec.kind].color, 0.3);
      c.strokeStyle = col; c.lineWidth = 1 / zoom;
      c.setLineDash([5 / zoom, 5 / zoom]); c.beginPath(); c.arc(gx, gy, R, 0, 7); c.stroke(); c.setLineDash([]);
      c.beginPath(); c.ellipse(gx, gy, R, R * 0.36, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(gx, gy, R * 0.36, R, 0, 0, 7); c.stroke();
      txt('360°', gx + R * 0.72 + 13 / zoom, gy - R * 0.72 - 4 / zoom, 10 / zoom, rgb(KINDS[h.spec.kind].color, 0.5), true);
    }
  }
  for (const s of chispas) { const k = s.t / 0.7, [x, y] = proj(s.x, s.y, s.z), r = (3.5 * (1 - k) + 1) / zoom; c.fillStyle = rgb(s.color, 1 - k); c.fillRect(x - r, y - r, r * 2, r * 2); }
  for (const f of floats) { const [x, y] = proj(f.x, f.y, f.z); c.globalAlpha = 1 - f.t / 0.9; c.save(); c.translate(x, y - f.t * 40 / zoom); c.scale(1 / zoom, 1 / zoom); const z0 = zoom; zoom = 1; glowText(f.text, 0, 0, 22, f.color, 8); zoom = z0; c.restore(); }
  c.globalAlpha = 1;
  c.restore(); zoom = zoomWas;

  // From here on, drawn on the screen itself, not through the camera.
  // What is coming: the next two pieces, small and faint in the corner, the nearer one first
  const hudLeft = 200 - Math.min(vw, 560) / (2 * sc);
  if (S.phase === 'play') [[hudLeft + 28, T0 + 22, 13, 0.6], [hudLeft + 60, T0 + 22, 9, 0.32]].forEach(([x, y, r, a], i) => {
    const nx = S.queue[i]; if (!nx) return;
    let b = previews.get(nx); if (!b) previews.set(nx, b = mkBody(-9, formFor(nx), 0, 0, 0));
    CAM = { cx: x, cy: y, u: r / b.form.r, c: 1, s: 0 }; const z = zoom; zoom = 1;
    for (const it of paintOrder(b.looks.map(q => ({ b: q })))) drawPiece(nx.kind, it.b, { alpha: a });
    zoom = z; CAM = MAIN;
  });

  if (banner) {
    const b = banner, [name, line] = kindText(b.kind), col = rgb(KINDS[b.kind].color), a = Math.min(1, b.t * 5) * Math.min(1, (2.4 - b.t) * 2.5), y = 92;
    c.globalAlpha = a;
    glowText(ui('b3New', { n: name }), 200, y, 34, col, 14);
    txt(line, 200, y + 28, 14, 'rgba(255,255,255,0.85)', true);
    c.globalAlpha = 1;
  }
  for (const s of says) { c.globalAlpha = 1 - s.t / 1.3; glowText(s.text, 200, 170 - s.t * 26, s.size, s.color, 14); }
  c.globalAlpha = 1;
  const dialTop = drawDial(B0), baseY = dialTop - 2, showing = opening != null;
  if (state === 'play' && showing) {
    // The opening shows how the board is turned, once the camera is nearly there: a thumb sliding along the dial as the board turns and, on a touch screen, two fingertips twisting over it. Nothing is said: it ends with the turn
    const mid = dialTop + DIAL.h / 2, tx = 200 + 70 * Math.cos(ok * Math.PI);
    c.globalAlpha = Math.max(0, Math.min(1, (ok - 0.4) / 0.2));
    c.lineWidth = 2; c.beginPath(); c.arc(tx, mid, 12, 0, 7); glowLine('#2ee6d6', 10); c.fillStyle = 'rgba(255,255,255,0.4)'; c.strokeStyle = '#fff'; c.fill(); c.stroke();
    if (!FINE) {
      const cx = 200, cy = ZY + (MAIN.cy - 150 - ZY) * zoom;
      for (const g of [1, -1]) { c.lineWidth = 2; c.beginPath(); c.arc(cx + g * 38 * Math.cos(yaw), cy + g * 38 * Math.sin(yaw), 11, 0, 7); glowLine('#2ee6d6', 8); c.fillStyle = 'rgba(255,255,255,0.35)'; c.strokeStyle = '#fff'; c.fill(); c.stroke(); }
      c.strokeStyle = 'rgba(46,230,214,0.8)'; c.lineWidth = 2; c.setLineDash([4, 5]); c.beginPath(); c.arc(cx, cy, 38, 0, 7); c.stroke(); c.setLineDash([]);
    }
    c.globalAlpha = 1;
  }
  if (state === 'play' && drag && !drag.twisted && S.held) {
    // A pointer that rests: a ring fills around it, and then it does the other thing: it turns the piece, or moves it again
    const x = drag.px, y = drag.py, col = rgb(KINDS[S.held.spec.kind].color);
    if (drag.armed && drag.held > 0.15) { c.strokeStyle = col; c.globalAlpha = 0.4; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); c.arc(x, y, 22, -1.5708, -1.5708 + 6.2832 * Math.min(1, drag.held / HOLD_S)); c.stroke(); c.globalAlpha = 1; }
    c.globalAlpha = 0.5;
    if (drag.grab) { c.strokeStyle = col; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, 22, 0, 7); c.stroke(); txt(ui('b3Turns'), x, y + 35, 11.5, col, true); }
    else if (clock - drag.switched < 1) txt(ui('b3Moves'), x, y + 35, 11.5, '#fff', true);
    c.globalAlpha = 1;
  }
  if (state === 'play' && !showing && !turned) txt(ui('b3HintBoard'), 200, baseY - 10, 13.5, 'rgba(46,230,214,0.95)', true);
  else if (state === 'play' && !showing && !S.perfects && S.released < 8) txt(ui('b3HintLevel'), 200, baseY - 10, 13.5, 'rgba(190,255,120,0.9)', true);
  if (state === 'play' && !showing && S.landed < 2 && S.released < 3) txt(ui('b3HintMove'), 200, baseY - 28, 13.5, 'rgba(255,255,255,0.72)', true);
  else if (state === 'play' && !showing && !rotated && S.held) txt(ui('b3HintPiece'), 200, baseY - 28, 13.5, 'rgba(255,210,63,0.95)', true);
  if (state === 'pause') { c.fillStyle = 'rgba(21,7,38,0.72)'; c.fillRect(L0, T0, R0 - L0, B0 - T0); txt(ui('b3Paused'), 200, 270, 44); txt(ui('b3Resume'), 200, 316, 17, 'rgba(255,255,255,0.72)', true); }
}

/* ---------- the lives: three solid hearts, that break ---------- */
/**
 * The lives are three small solid hearts on a canvas of their own over the top bar: each a heart's
 * outline given depth and a bevelled face, lit from above and the left, swaying so its side shows.
 * A life lost breaks its heart: it swells and whitens while a crack runs down it, then splits along
 * the crack into two halves that tumble away and fall, with a few chips and a ring of light; a dark
 * heart stays in its place. This is the view's own small renderer (seen straight on, no perspective),
 * apart from the game's; nothing here touches the simulation.
 */
const hv = $('#hearts'), hc = hv.getContext('2d'), HEARTS_W = 240, HEARTS_H = 150, HEART_N = 40, HEART_S = 13, HEART_GAP = 33, HEART_Y = 20;
const HEART_PINK = [255, 46, 136], HEART_GONE = [66, 32, 100], HEART_LIGHT = [-0.349, 0.648, 0.677];
const CRACK_S = 0.18, BREAK_S = 1.15, STILL = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
/** The outline, from the notch down the right side to the tip and back up the left; about 1.9 wide and 1.7 tall, around (0, 0). */
const HEART = Array.from({ length: HEART_N }, (_, k) => { const t = 2 * Math.PI * k / HEART_N, s = Math.sin(t); return [16 * s * s * s / 17, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15]; });
/** The crack, from the notch to the tip, and the two halves it leaves (right, left), each around its own middle. */
const CRACK = [HEART[0], [0.2, 0.18], [-0.17, -0.08], [0.15, -0.32], [-0.09, -0.56], HEART[HEART_N / 2]];
const centred = P => { let x = 0, y = 0; for (const q of P) { x += q[0]; y += q[1]; } x /= P.length; y /= P.length; return { at: [x, y], P: P.map(q => [q[0] - x, q[1] - y]) }; };
const HALVES = [centred([...HEART.slice(0, HEART_N / 2 + 1), ...CRACK.slice(1, -1).reverse()]), centred([...HEART.slice(HEART_N / 2), HEART[0], ...CRACK.slice(1, -1)])];
const CHIP = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
/** A turn about the vertical (yaw), then a nod (pitch: the top toward the viewer), then a roll in the screen's plane: rows of the matrix, x right, y up, z toward the viewer. */
function heartTurn(yw, pitch = 0, roll = 0) {
  const cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  const a = [cy, 0, sy], b = [sp * sy, cp, -sp * cy];
  return [cr * a[0] - sr * b[0], cr * a[1] - sr * b[1], cr * a[2] - sr * b[2], sr * a[0] + cr * b[0], sr * a[1] + cr * b[1], sr * a[2] + cr * b[2], -cp * sy, sp, cp * cy];
}
/**
 * A flat shape given depth, drawn at (x, y), `s` pixels to the unit: its outline P (around its own
 * middle), turned by R. `o`: h, half its depth; bevel, how deep the slanted border of each face is
 * (0: none); alpha; white, how far toward white; gloss, a small shine on the front face. Only the
 * faces that look at the viewer are drawn, the far ones first.
 */
function solidHeart(P, R, x, y, s, col, { h = 0.3, bevel = 0.13, alpha = 1, white = 0, gloss = false } = {}) {
  const n = P.length, IN = bevel ? 0.72 : 1, w = h - bevel, faces = [];
  let area = 0; for (let k = 0; k < n; k++) { const a = P[k], b = P[(k + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const way = area > 0 ? 1 : -1;
  const at = (q, z, k) => [x + s * (R[0] * q[0] * k + R[1] * q[1] * k + R[2] * z), y - s * (R[3] * q[0] * k + R[4] * q[1] * k + R[5] * z), R[6] * q[0] * k + R[7] * q[1] * k + R[8] * z];
  const face = (pts, nx, ny, nz) => {
    if (R[6] * nx + R[7] * ny + R[8] * nz <= 0) return;
    const lx = R[0] * nx + R[1] * ny + R[2] * nz, ly = R[3] * nx + R[4] * ny + R[5] * nz, lz = R[6] * nx + R[7] * ny + R[8] * nz;
    let z = 0; for (const q of pts) z += q[2];
    faces.push({ pts, z: z / pts.length, k: 0.4 + 0.75 * Math.max(0, lx * HEART_LIGHT[0] + ly * HEART_LIGHT[1] + lz * HEART_LIGHT[2]) });
  };
  for (let k = 0; k < n; k++) {
    const a = P[k], b = P[(k + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], len = Math.sqrt(ex * ex + ey * ey) || 1, nx = way * ey / len, ny = -way * ex / len;
    face([at(a, -w, 1), at(b, -w, 1), at(b, w, 1), at(a, w, 1)], nx, ny, 0);
    if (bevel) {
      face([at(a, w, 1), at(b, w, 1), at(b, h, IN), at(a, h, IN)], nx * 0.6, ny * 0.6, 0.8);
      face([at(a, -w, 1), at(b, -w, 1), at(b, -h, IN), at(a, -h, IN)], nx * 0.6, ny * 0.6, -0.8);
    }
  }
  face(P.map(q => at(q, h, IN)), 0, 0, 1); face(P.map(q => at(q, -h, IN)), 0, 0, -1);
  faces.sort((a, b) => a.z - b.z);
  hc.save(); hc.globalAlpha *= alpha; hc.lineJoin = 'round';
  for (const f of faces) {
    let shade = f.k <= 1 ? sombra(col, f.k) : claro(col, Math.min(1, (f.k - 1) * 1.3)); if (white) shade = claro(shade, white);
    hc.beginPath(); f.pts.forEach((q, i) => (i ? hc.lineTo(q[0], q[1]) : hc.moveTo(q[0], q[1]))); hc.closePath();
    hc.fillStyle = hc.strokeStyle = rgb(shade); hc.fill();
    if (alpha >= 1) { hc.lineWidth = 0.5; hc.stroke(); }   // closes the hairlines between neighbouring faces
  }
  if (gloss && R[8] > 0.3) {
    hc.beginPath();
    for (let i = 0; i < 12; i++) { const t = i * Math.PI / 6, u = 0.17 * Math.cos(t), v = 0.075 * Math.sin(t), q = at([-0.31 + u * 0.8 - v * 0.6, 0.3 + u * 0.6 + v * 0.8], h + 0.01, 1); i ? hc.lineTo(q[0], q[1]) : hc.moveTo(q[0], q[1]); }
    hc.closePath(); hc.fillStyle = `rgba(255,255,255,${0.7 * R[8]})`; hc.fill();
  }
  hc.restore();
}
/** When each heart broke (by the view's clock; null: whole), the chips it threw, and, for the lab, a moment to hold the picture at. */
let heartLost = [null, null, null], heartChips = [[], [], []], heartFrozen = null;
function breakHeart(i, at, wait = 0) {
  heartLost[i] = at;
  heartChips[i] = Array.from({ length: 7 }, (_, k) => { const a = (k + Math.random()) * 2 * Math.PI / 7, v = 45 + 60 * Math.random(); return { vx: v * Math.cos(a), vy: -v * Math.abs(Math.sin(a)) - 25, sz: 0.9 + 1.1 * Math.random(), a, col: k % 3 ? HEART_PINK : claro(HEART_PINK, 0.55) }; });
  if (!STILL) { tone({ freq: 1250, to: 420, type: 'square', dur: 0.07, gain: 0.045, delay: wait + CRACK_S * 0.5 }); tone({ freq: 300, to: 110, type: 'triangle', dur: 0.2, gain: 0.12, delay: wait + CRACK_S }); }
}
/** What the hearts' canvas shows: while none is breaking they move 20 times a second, and the canvas is left alone when nothing changed. */
let heartsWere = '';
function drawHearts() {
  const breaking = heartLost.some(a => a != null && clock - a <= BREAK_S + 0.05);
  const key = !S ? 'none' : breaking || heartFrozen != null ? null : `${S.capsized ? 0 : S.lives}|${STILL ? 0 : Math.floor(clock * 20)}`;
  if (key !== null && key === heartsWere) return;
  heartsWere = key || '';
  hc.setTransform(dpr, 0, 0, dpr, 0, 0); hc.clearRect(0, 0, HEARTS_W, HEARTS_H);
  if (!S) { heartLost = [null, null, null]; return; }
  // The hearts go from the right; when the disc goes over, whatever was left goes with it, one after another
  const now = heartFrozen != null ? heartFrozen : clock, left = S.capsized ? 0 : S.lives;
  for (let i = 2, wait = 0; i >= 0; i--) {
    if (i < left) heartLost[i] = null;
    else if (heartLost[i] == null) { breakHeart(i, now + wait, wait); wait += 0.14; }
  }
  const age = i => (heartLost[i] == null ? -1 : now - heartLost[i]), xOf = i => HEARTS_W / 2 + (i - 1) * HEART_GAP;
  const sway = i => (STILL ? 0.3 : 0.55 * Math.sin(now * 1.5 + i * 1.1)), NOD = 0.22;
  for (let i = 0; i < 3; i++) {
    const x = xOf(i), a = age(i);
    if (a < 0) {
      // Whole: it glows, sways and bobs; the last one left beats
      const beat = !STILL && left === 1 ? 1 + 0.14 * Math.max(0, Math.sin(now * 6.5)) ** 3 : 1, y = HEART_Y + (STILL ? 0 : 0.8 * Math.sin(now * 2.1 + i * 1.7));
      const g = hc.createRadialGradient(x, y, 2, x, y, 19); g.addColorStop(0, 'rgba(255,46,136,0.42)'); g.addColorStop(1, 'rgba(255,46,136,0)');
      hc.fillStyle = g; hc.fillRect(x - 20, y - 20, 40, 40);
      solidHeart(HEART, heartTurn(sway(i), NOD), x, y, HEART_S * beat, HEART_PINK, { gloss: true });
    } else {
      // Gone: a dark heart in its place, once the bright one has split (or as it fades, with motion reduced)
      const k = STILL ? Math.min(1, a / 0.3) : Math.max(0, Math.min(1, (a - CRACK_S) / 0.35));
      if (k > 0) { hc.save(); hc.globalAlpha = k; solidHeart(HEART, heartTurn(sway(i), NOD), x, HEART_Y, HEART_S * 0.9, HEART_GONE); hc.restore(); }
      if (STILL && a < 0.3) solidHeart(HEART, heartTurn(sway(i), NOD), x, HEART_Y, HEART_S, HEART_PINK, { alpha: 1 - a / 0.3 });
    }
  }
  if (STILL) return;
  for (let i = 0; i < 3; i++) {
    const x = xOf(i), a = age(i);
    if (a < 0 || a > BREAK_S) continue;
    if (a < CRACK_S) {
      // It swells, turns to face the player and whitens, shaking, while the crack runs down it
      const k = a / CRACK_S, s = HEART_S * (1 + 0.32 * Math.sin(k * Math.PI / 2)), R = heartTurn(sway(i) * (1 - k), NOD * (1 - k)), jx = x + 1.3 * Math.sin(a * 130);
      solidHeart(HEART, R, jx, HEART_Y, s, HEART_PINK, { white: 0.7 * k, gloss: true });
      const upTo = k * (CRACK.length - 1);
      hc.beginPath();
      for (let j = 0; j < CRACK.length && j <= Math.ceil(upTo); j++) {
        const f = j <= upTo ? 1 : upTo - (j - 1), p = j ? CRACK[j - 1] : CRACK[0], q = CRACK[j], px = p[0] + (q[0] - p[0]) * f, py = p[1] + (q[1] - p[1]) * f;
        const X = jx + s * (R[0] * px + R[1] * py + R[2] * 0.3), Y = HEART_Y - s * (R[3] * px + R[4] * py + R[5] * 0.3);
        j ? hc.lineTo(X, Y) : hc.moveTo(X, Y);
      }
      hc.strokeStyle = '#fff'; hc.lineWidth = 1.3; hc.lineJoin = 'round'; hc.lineCap = 'round'; hc.stroke();
      continue;
    }
    const t = a - CRACK_S, s = HEART_S * (1.32 - 0.32 * Math.min(1, t / 0.2)), fade = t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) / (BREAK_S - CRACK_S - 0.5));
    // A ring of light where it broke
    if (t < 0.4) { hc.beginPath(); hc.arc(x, HEART_Y, 11 + 62 * t, 0, 2 * Math.PI); hc.strokeStyle = `rgba(255,46,136,${0.85 * (1 - t / 0.4)})`; hc.lineWidth = 2.2 * (1 - t / 0.4) + 0.4; hc.stroke(); }
    // The two halves: thrown apart and up, tumbling each about its own middle, and falling
    HALVES.forEach((half, j) => {
      const side = j ? -1 : 1, hx = x + s * half.at[0] + side * (5 * Math.min(1, t / 0.08) + 30 * t), hy = HEART_Y - s * half.at[1] - 74 * t + 205 * t * t;
      solidHeart(half.P, heartTurn(side * 2.4 * t, (j ? 1.1 : -0.9) * t, -side * 1.25 * t), hx, hy, s, HEART_PINK, { alpha: fade, white: 0.7 * Math.max(0, 1 - t / 0.22) });
    });
    // And a few chips
    if (t < 0.75) for (const ch of heartChips[i]) solidHeart(CHIP, heartTurn(ch.a + 9 * t, ch.a * 2 + 7 * t, 5 * t), x + ch.vx * t, HEART_Y + ch.vy * t + 230 * t * t, ch.sz, ch.col, { h: 1, bevel: 0, alpha: 1 - t / 0.75, white: 0.5 * Math.max(0, 1 - t / 0.25) });
  }
}
let hudWas = null;
function hud() {
  const now = S ? `${S.streak}|${S.landed}|${S.capsized ? 0 : S.lives}|${S.score}` : '';
  if (now === hudWas) return;
  hudWas = now;
  if (!S) { $('#count').textContent = ''; $('#score').textContent = ''; $('#chip').hidden = true; return; }
  // The lives in the middle, as in the other games; the pieces placed (and the perfect streak) on the left
  $('#count').textContent = S.streak > 1 ? `🧱 ${S.landed} · 🔥 ×${S.streak}` : `🧱 ${S.landed}`;
  // The hearts themselves are drawn, solid, on their own canvas (drawHearts): here only their place in the bar and what a screen reader hears
  $('#chip').hidden = false; $('#chip').textContent = ''; $('#chip').setAttribute('role', 'img'); $('#chip').setAttribute('aria-label', some('b3LivesAria', S.capsized ? 0 : S.lives));
  $('#score').textContent = S.score;
}

/* ---------- the flow ---------- */
const card = $('#card');
function showCard(emoji, title, html, btn) { $('#cEmoji').textContent = emoji; $('#cTitle').textContent = title; $('#cBody').innerHTML = html; $('#cBtn').textContent = btn; card.hidden = false; }
/* The instructions: four steps, each with a small moving picture (SVG, moved by the page's CSS). */
const cube = (x, y, s, [top, right, left]) => `<polygon points="${x},${y - s * 0.5} ${x + s * 0.87},${y} ${x},${y + s * 0.5} ${x - s * 0.87},${y}" fill="${top}"/><polygon points="${x - s * 0.87},${y} ${x},${y + s * 0.5} ${x},${y + s * 1.5} ${x - s * 0.87},${y + s}" fill="${left}"/><polygon points="${x},${y + s * 0.5} ${x + s * 0.87},${y} ${x + s * 0.87},${y + s} ${x},${y + s * 1.5}" fill="${right}"/>`;
const TEAL = ['#5fefe2', '#23ac9f', '#19806f'], ROSE = ['#ff6fae', '#d92574', '#a01a55'];
const discPic = (cx, cy) => `<ellipse cx="${cx}" cy="${cy + 5}" rx="46" ry="26" fill="#3a1464"/><ellipse cx="${cx}" cy="${cy}" rx="46" ry="26" fill="#7a56b8" stroke="url(#rb)" stroke-width="4"/>`;
const pic = inner => `<svg viewBox="0 0 120 84" aria-hidden="true">${inner}</svg>`;
function ready() {
  const move = pic(`<defs><linearGradient id="rb" x1="0" x2="1"><stop offset="0" stop-color="#ffd23f"/><stop offset=".35" stop-color="#9dff3a"/><stop offset=".65" stop-color="#2ee6d6"/><stop offset="1" stop-color="#ff2e88"/></linearGradient></defs>
    ${discPic(60, 58)}<g class="il-move"><polygon points="60,50 74,58 60,66 46,58" fill="rgba(14,2,34,.55)"/><g class="il-drop">${cube(60, 14, 14, TEAL)}</g><text class="il-finger" x="78" y="46" font-size="18">${FINE ? '🖱️' : '👆'}</text></g>`);
  const spin = pic(`<ellipse cx="60" cy="45" rx="46" ry="26.2" fill="#3a1464"/><g transform="translate(60 40) scale(1 .57)"><g class="il-spin"><circle r="46" fill="#7a56b8" stroke="url(#rb)" stroke-width="6"/><path d="M-46 0H46M0 -46V46" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/><rect x="12" y="-30" width="18" height="18" rx="2" fill="#2ee6d6"/><rect x="-30" y="8" width="16" height="16" rx="2" fill="#ff2e88"/></g></g>
    <g transform="translate(60 40)"><g class="il-twist"><circle cx="-24" cy="0" r="6" fill="rgba(255,255,255,.45)" stroke="#fff" stroke-width="1.5"/><circle cx="24" cy="0" r="6" fill="rgba(255,255,255,.45)" stroke="#fff" stroke-width="1.5"/></g></g>
    <rect x="22" y="70" width="76" height="12" rx="6" fill="rgba(0,0,0,.4)" stroke="rgba(46,230,214,.8)"/><path d="M40 73v6M50 73v6M60 72v8M70 73v6M80 73v6" stroke="#ffd23f" stroke-width="1.5" stroke-linecap="round"/><circle class="il-thumb" cx="60" cy="76" r="6" fill="rgba(255,255,255,.4)" stroke="#fff" stroke-width="1.5"/>`);
  const level = pic(`<ellipse class="il-hoop" cx="60" cy="52" rx="54" ry="31" fill="none" stroke="#fff" stroke-width="1.6"/><g class="il-rock">${discPic(60, 52)}${cube(36, 36, 10, TEAL)}<g class="il-second">${cube(84, 36, 10, ROSE)}</g></g><text class="il-ok" x="60" y="13" text-anchor="middle" font-size="12" font-weight="900" fill="#9dff3a">${ui('b3Perfect')}</text>`);
  const turnIt = pic(`<g class="il-turn">${cube(60, 22, 20, TEAL)}</g><path d="M22 30a40 30 0 0 1 14-20M98 30a40 30 0 0 0-14-20" fill="none" stroke="#ffd23f" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 4"/>
    <g class="il-hold"><circle cx="60" cy="70" r="10" fill="none" stroke="#ffd23f" stroke-width="2"/><circle cx="60" cy="70" r="6" fill="rgba(255,255,255,.45)" stroke="#fff" stroke-width="1.5"/></g>`);
  const step = (n, picture, key) => { const [title, line] = ui(key).split('|'); return `<li>${picture}<div><b><span class="n">${n}</span>${title}</b><p>${line}</p></div></li>`; };
  // How long the first piece waits before it falls by itself (it gets shorter with every piece)
  showCard('', GAME.nombre, `<p class="lema">${ui('b3Lema')}</p><ol class="steps">
    ${step(1, move, 'b3Step1')}${step(2, turnIt, 'b3Step2')}${step(3, spin, 'b3Step3')}${step(4, level, 'b3Step4')}</ol>
    <p class="pie">⏳ ${ui('b3AutoNote', { n: Math.round(params(fromParam).hold) })}<br>❤️ ${ui('b3LivesNote')}</p>`, ui('b3Play'));
}
const query = new URLSearchParams(location.search), seedParam = query.get('seed');
/** Lab only: `?from=30` starts as hard as if 30 pieces were already down (on an empty disc), to try the late pieces. */
const fromParam = Math.max(0, Math.min(500, Math.floor(Number(query.get('from')) || 0)));
function start() {
  S = newGame(seedParam != null ? Number(seedParam) | 0 : Date.now() | 0, fromParam);
  state = 'play'; acc = 0; chispas = []; anillos = []; floats = []; says = []; banner = null; zoom = 1; card.hidden = true;
  target = { x: 0, z: 0 }; dropQ = false; drag = null; turning = null; twist = null; fingers.clear(); seen = null; yaw = 0;
  // The opening turn, at the start of every game (`?spin=0` skips it: lab only)
  opening = query.get('spin') === '0' ? null : 0; sinceOpening = opening == null ? 99 : 0; handQ = null;
}
function finish() {
  state = 'over';
  const s = Math.round(S.t), time = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  showCard('⚖️', ui('b3Over'), `<p class="big">${S.score}</p><ul>${S.capsized ? `<li>${ui('b3BdTipped')}</li>` : ''}
    <li>${some('b3BdPieces', S.landed)}</li>
    <li>${some('b3BdPerfects', S.perfects, { p: S.bonus })}</li>
    <li>${ui('b3BdStreak', { n: S.best })}</li>
    <li>${ui('b3BdHeight', { m: decimal(S.peak) })}</li>
    <li>${ui('b3BdTime', { t: time })}</li></ul>`, ui('b3Again'));
}

/* ---------- input ---------- */
/*
 * The piece: a finger drags it and lets it go; a mouse just moves and clicks; arrows and Space.
 * Before letting go, a pointer that rests for a moment (the finger, or the mouse with its button down)
 * takes hold of the piece itself: moving then turns it, any way and all the way round, like a ball under
 * the finger, so the player chooses which side it falls on; letting go drops it as it is. Resting again
 * goes back to moving it.
 * The view: two fingers twisting, or the dial at the bottom (a thumb, or the mouse); a mouse also has
 * its wheel, its right button, and Q and E. It only turns about the vertical: the angle it looks down
 * from never changes.
 * `target` is where the player holds the piece over, `dropQ` whether they let it go, `drag` the finger
 * (or the mouse button) on the piece, `turning` the pointer on the dial, `fingers` the touches on the
 * scene (id → place on screen) and `twist` the two of them that are turning the view.
 */
let target = { x: 0, z: 0 }, dropQ = false, drag = null, turning = null, twist = null, mouseAt = null, seen = null, swallow = false;
/** Whether this player has ever turned the view (kept between visits): until then the game shows how. */
const TURNED_KEY = 'balanza-lab:turned', ROTATED_KEY = 'balanza-lab:rotated';
/** Resting this long (seconds) changes what the pointer does (move the piece, or turn it); moving further than STILL_SLACK (in the screen's 400 × 600) is not resting. A pixel turns the piece by PIECE_GAIN, and the view (right button) by TURN_GAIN. */
const HOLD_S = 0.45, STILL_SLACK = 6, PIECE_GAIN = 0.014, TURN_GAIN = 0.012;
/** How the player has turned the piece in hand ([w, x, y, z]), or null if they have not; and whether they ever have (kept between visits). */
let handQ = null, rotated = false;
try { rotated = localStorage.getItem(ROTATED_KEY) === '1'; } catch (_) { /* no storage */ }
const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
/**
 * Turns the piece in hand as a drag of (dx, dy) on screen would turn a ball: sideways about the vertical,
 * up and down about the line across the screen, so its near side follows the finger whichever way the view is turned.
 */
function turnPiece(dx, dy) {
  const h = S.held; if (!h) return;
  const [rx, rz] = ground(0.7071, -0.7071), a = dx * PIECE_GAIN / 2, b = dy * PIECE_GAIN / 2;
  handQ = qmul([Math.cos(a), 0, Math.sin(a), 0], qmul([Math.cos(b), rx * Math.sin(b), 0, rz * Math.sin(b)], handQ || [h.qw, h.qx, h.qy, h.qz]));
  if (!rotated) { rotated = true; try { localStorage.setItem(ROTATED_KEY, '1'); } catch (_) { /* no storage */ } }
}
let turned = false;
try { turned = localStorage.getItem(TURNED_KEY) === '1'; } catch (_) { /* no storage */ }
/**
 * The opening: every game starts with the camera coming down on the empty disc from far above and going
 * once around it as it arrives, before the first piece comes, so it is seen that the board turns (the
 * dial turns with it, under a thumb). `opening` is how far into it the game is (seconds), or null; any
 * touch or key cuts it short.
 */
const OPENING_S = 2.8;
let opening = null, sinceOpening = 99;
const fingers = new Map();
/** The direction from one twisting finger to the other, as an angle on screen. */
const twistAngle = () => { const p = fingers.get(twist.a), q = fingers.get(twist.b); return Math.atan2(q[1] - p[1], q[0] - p[0]); };
const keys = new Set();
function reach(x, z) { const d2 = x * x + z * z; if (d2 > REACH * REACH) { const l = REACH / Math.sqrt(d2); x *= l; z *= l; } return { x, z }; }
/** A pointer's place on the canvas in the screen's own 400 × 600. */
function onScreen(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left - ox) / sc, (e.clientY - r.top - oy) / sc]; }
/** That place in the scene, before the camera's zoom. */
const inScene = ([x, y]) => [200 + (x - 200) / zoom, ZY + (y - ZY) / zoom];
const onDial = ([x, y]) => { const bottom = (vh - oy) / sc; return y > bottom - 16 - DIAL.h && x > DIAL.x0 - 8 && x < DIAL.x1 + 8; };
/** A mouse holds the piece itself: the spot under the pointer at the height of the hand. */
function underPointer([x, y]) {
  const a = (x - MAIN.cx) / (C30 * MAIN.u), b = (y - MAIN.cy + S.hover * MAIN.u) / (0.5 * MAIN.u), [gx, gz] = ground((a + b) / 2, (b - a) / 2);
  return reach(gx, gz);
}
/** Turns the view. The piece in hand is the player's, not the disc's: it stays where it is on screen, and the disc turns under it. */
function spinView(d) {
  yaw += d;
  if (!turned) { turned = true; try { localStorage.setItem(TURNED_KEY, '1'); } catch (_) { /* no storage */ } }
  const co = Math.cos(d), si = Math.sin(d), x = target.x * co + target.z * si;
  target.z = target.z * co - target.x * si; target.x = x;
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); audio();
  if (!card.hidden) return;
  if (state === 'pause') { state = 'play'; swallow = true; return; }
  if (state !== 'play') return;
  if (opening != null) { opening = null; yaw = 0; sinceOpening = 0; swallow = true; return; }
  try { cv.setPointerCapture(e.pointerId); } catch (_) { /* a synthetic event has no pointer to capture */ }
  const p = onScreen(e);
  // On the dial, or with a mouse's right button: it turns the view
  if (onDial(p) || e.button === 2) { if (!turning) turning = { id: e.pointerId, x: p[0] }; return; }
  const q = inScene(p);
  if (e.pointerType === 'mouse') { mouseAt = q; target = underPointer(q); drag = { id: e.pointerId, mouse: true, x: q[0], y: q[1], twisted: false, held: 0, armed: true, grab: false, switched: -9, ax: p[0], ay: p[1], px: p[0], py: p[1] }; return; }
  fingers.set(e.pointerId, p);
  // A second finger: the two twist the view, and this touch will not drop the piece when it ends (fingers rarely lift together)
  if (fingers.size === 2) { const [a, b] = [...fingers.keys()]; twist = { a, b, angle: 0 }; twist.angle = twistAngle(); if (drag) drag.twisted = true; return; }
  if (fingers.size > 2) return;
  // One finger drags from wherever it lands, so it never covers the piece: the piece moves as the finger does
  mouseAt = null; drag = { id: e.pointerId, x: q[0], y: q[1], twisted: false, held: 0, armed: true, grab: false, switched: -9, ax: p[0], ay: p[1], px: p[0], py: p[1] };
});
cv.addEventListener('pointermove', e => {
  if (!S || state !== 'play') return;
  const p = onScreen(e);
  if (turning && turning.id === e.pointerId) { spinView(-(p[0] - turning.x) * TURN_GAIN); turning.x = p[0]; return; }
  const q = inScene(p);
  if (drag && drag.id === e.pointerId) {
    // Moving on starts the wait over: only a pointer that rests changes what it does
    if (Math.abs(p[0] - drag.ax) + Math.abs(p[1] - drag.ay) > STILL_SLACK) { drag.held = 0; drag.armed = true; drag.ax = p[0]; drag.ay = p[1]; }
    const dx = p[0] - drag.px, dy = p[1] - drag.py; drag.px = p[0]; drag.py = p[1];
    // It has hold of the piece: moving turns it (and the piece stays where it is)
    if (drag.grab && !twist) { turnPiece(dx, dy); drag.x = q[0]; drag.y = q[1]; if (fingers.has(e.pointerId)) fingers.set(e.pointerId, p); return; }
  }
  if (e.pointerType === 'mouse') { if (!onDial(p)) mouseAt = q; return; }
  if (!fingers.has(e.pointerId)) return;
  fingers.set(e.pointerId, p);
  if (twist) {
    // Clockwise on screen is clockwise for the disc; the piece is not dragged meanwhile
    if (e.pointerId !== twist.a && e.pointerId !== twist.b) return;
    const a = twistAngle(); let d = a - twist.angle;
    if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
    twist.angle = a; spinView(d);
    return;
  }
  if (!drag || drag.id !== e.pointerId) return;
  const a = (q[0] - drag.x) / (C30 * MAIN.u), b = (q[1] - drag.y) / (0.5 * MAIN.u), [gx, gz] = ground((a + b) / 2, (b - a) / 2);
  drag.x = q[0]; drag.y = q[1]; target = reach(target.x + gx, target.z + gz);
});
function letGo(e) {
  if (swallow) { swallow = false; return; }
  if (turning && turning.id === e.pointerId) { turning = null; return; }
  if (fingers.delete(e.pointerId) && twist && (e.pointerId === twist.a || e.pointerId === twist.b)) {
    twist = null;
    // The finger that stays goes on with the piece from where it is now
    if (drag && fingers.has(drag.id)) { const q = inScene(fingers.get(drag.id)); drag.x = q[0]; drag.y = q[1]; }
  }
  if (!drag || drag.id !== e.pointerId) return;
  const twisted = drag.twisted; drag = null;
  if (!twisted && S && state === 'play' && S.held && e.type === 'pointerup') dropQ = true;
}
cv.addEventListener('pointerup', letGo); cv.addEventListener('pointercancel', letGo);
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { e.preventDefault(); if (S && state === 'play') spinView(-(e.deltaY + e.deltaX) * 0.003); }, { passive: false });
const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, -1], KeyS: [0, 1] };
window.addEventListener('keydown', e => {
  if (ARROWS[e.code]) { e.preventDefault(); keys.add(e.code); mouseAt = null; return; }
  if (e.code === 'KeyQ' || e.code === 'KeyE') { keys.add(e.code); return; }
  if (e.code !== 'Space' && e.code !== 'Enter') return;
  e.preventDefault();
  if (e.repeat) return;
  audio();
  if (!card.hidden) $('#cBtn').click();
  else if (state === 'pause') state = 'play';
  else if (opening != null) { opening = null; yaw = 0; sinceOpening = 0; }
  else if (state === 'play' && S.held) dropQ = true;
});
window.addEventListener('keyup', e => keys.delete(e.code));
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') { state = 'pause'; drag = null; turning = null; twist = null; fingers.clear(); keys.clear(); } });

let last = 0, framesUnderCard = 0;
/** Frames gaps while playing, to lower the resolution when they come slow (see `RES`). */
let paceMs = 0, paceN = 0, paceSlow = 0;
function pace(gap) {
  if (RES_PARAM || gap > 400) return;
  paceMs += gap; paceN++; if (paceMs < 1000) return;
  const mean = paceMs / paceN; paceN = paceMs = 0;
  if (mean <= 24 || dpr <= 1) { paceSlow = 0; return; }
  if (++paceSlow >= 2) { paceSlow = 0; RES = dpr > 1.5 ? 1.5 : 1; resize(); }
}
function frame(ts) {
  // A 120 Hz screen: every other call is let through, so the scene is drawn at most about 60 times a second (the game's clock does not change)
  if (ts - last < 10) { requestAnimationFrame(frame); return; }
  const gap = ts - last;
  const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts; clock += dt;
  if (S && state === 'play' && opening != null) {
    opening += dt;
    const k = Math.min(1, opening / OPENING_S), e = k < 0.5 ? 2 * k * k : 1 - (2 - 2 * k) * (2 - 2 * k) / 2;
    yaw = -2 * Math.PI * (1 - e);
    if (k >= 1) { opening = null; yaw = 0; sinceOpening = 0; }
  } else if (S && state === 'play') {
    sinceOpening += dt;
    // A pointer that rests changes what it does: it takes hold of the piece to turn it, or goes back to moving it. It must move on before it can change again
    if (drag && S.held && drag.armed && !drag.twisted && !twist && (drag.held += dt) >= HOLD_S) {
      drag.grab = !drag.grab; drag.armed = false; drag.held = 0; drag.switched = clock;
      if (!drag.grab && drag.mouse) mouseAt = inScene([drag.px, drag.py]);
      if (navigator.vibrate) navigator.vibrate(15);
    }
    if (keys.has('KeyQ')) spinView(2.2 * dt);
    if (keys.has('KeyE')) spinView(-2.2 * dt);
    MAIN.c = Math.cos(yaw); MAIN.s = Math.sin(yaw);
    let a = 0, b = 0; for (const k of keys) if (ARROWS[k]) { a += ARROWS[k][0]; b += ARROWS[k][1]; }
    if (a || b) { const [gx, gz] = ground((a + b) * 0.7 * dt, (b - a) * 0.7 * dt); target = reach(target.x + gx, target.z + gz); }
    else if (mouseAt && !(drag && drag.grab)) target = underPointer(mouseAt);
    acc += dt;
    for (let n = 0; acc >= DT && n < 8; n++) {
      const inp = S.held ? { x: target.x, z: target.z, q: handQ, drop: dropQ } : null;
      dropQ = false;
      advance(S, inp); acc -= DT;
      for (const e of S.ev) onEvent(e); S.ev.length = 0;
      // A new piece in hand: it starts where the game put it (under the pointer, for a mouse), and a finger still down goes on from there
      if (S.held && S.held !== seen) { seen = S.held; handQ = null; if (drag) { drag.grab = false; drag.held = 0; drag.armed = true; } target = mouseAt ? underPointer(mouseAt) : { x: seen.x, z: seen.z }; }
    }
    if (acc > DT * 8) acc = 0;
    if (S.done) finish();
  }
  if (state === 'play' && card.hidden && last && gap > 0) pace(gap);
  fx(dt);
  // Under a card only 1 frame in 4 is drawn: the scene only shows through the veil
  if (card.hidden || S == null || ++framesUnderCard % 4 === 0) render();
  hud(); drawHearts();
  requestAnimationFrame(frame);
}
$('#cBtn').addEventListener('click', e => { e.currentTarget.blur(); audio(); start(); });
const muteBtn = $('#mute'), paintMute = () => { muteBtn.textContent = muted ? '🔇' : '🔊'; };
muteBtn.addEventListener('click', () => { muted = !muted; try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (_) { /* no storage */ } paintMute(); muteBtn.blur(); });
window.addEventListener('resize', resize);
$('header a').setAttribute('aria-label', ui('b3Back')); muteBtn.setAttribute('aria-label', ui('b3Sound')); $('h1 span').textContent = GAME.nombre;
paintMute(); resize(); ready(); requestAnimationFrame(frame);
window.__balanza = { get S() { return S; }, get opening() { return opening; }, get handQ() { return handQ; }, get state() { return state; }, get target() { return target; }, get yaw() { return yaw; }, set yaw(v) { yaw = v; }, finish, newGame, advance, stepWorld, mkBody, mkForm, solid, blocks, formFor, place, weld, sat, meets, collide, params, pieceAt, specialAt, box, ball, KINDS, MASS, LANG, UI, TEXTS, DT, RAD, RIM, CLEAR, REACH, DIAL,
  show(s, st = 'play') { S = s; state = st; card.hidden = true; for (const e of s.ev) onEvent(e); s.ev.length = 0; }, fx, render, hud, drawHearts, HEART, HALVES, holdHearts(t) { heartFrozen = t; }, get heartLost() { return heartLost; }, get clock() { return clock; },
  get blurs() { return blurs; }, set blurs(v) { blurs = v; }, get res() { return dpr; } };
</script>
</body>
</html>
