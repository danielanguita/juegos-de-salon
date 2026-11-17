'use strict';
/**
 * ⚖️ Tembleque 3D — lab prototype. A disc rests on one point. Pieces arrive one at a time: the player
 * drags the one in hand over the disc, turns it any way they like, sees its shadow on whatever is under
 * it, and lets it fall; if the time runs out it falls by itself, where it is. They pile up, the disc
 * leans under their weight and gets knocked by every landing. Each piece that falls off costs a life:
 * the third ends the game. And if the disc leans too far for too long it goes over, pile and all, and
 * that ends it at once.
 *
 * The pieces are the 2D game's (Tembleque, the neon one), in 3D: the same kinds, coming in the same
 * order and as often, and all weighing the same.
 *
 * The player can turn the view around the disc to look at the pile from any side; that is the view's
 * business alone, the game never knows.
 *
 * Three parts: the physics (rigid bodies in 3D, pure), the game (the pile, the hand, the score, pure)
 * and the view (canvas, sound, input). The first two run on a fixed step and use only + − × ÷ and sqrt,
 * like Tren en Vilo's engine, so one seed and the same moves give the same game everywhere.
 *
 * The pile can grow without end because only its top is simulated piece by piece: once a piece is
 * buried and at rest it is welded to the disc (physics: `mkPart`; game: `weld`).
 */

/* ================================================================== */
/* Physics: bodies made of convex solids and balls, sequential impulses */
/* ================================================================== */
const DT = 1 / 120, GRAV = 12, ITER = 10, SLOP = 0.004, BETA = 0.2, MAX_BIAS = 0.6, REST_V = 0.6, SPEC = 0.01;
/** Every piece weighs the same; a ball that touches something loses this much spin a second (so it stays put on a level floor). */
const MASS = 1, ROLL = 14;
const IDENT = [1, 0, 0, 0, 1, 0, 0, 0, 1], C45 = 0.7071067811865476, SIN60 = 0.8660254037844386;
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/**
 * A convex solid from its corners and its faces (each a loop of corner indexes, in order around the
 * face): moved so its centre of mass is the origin, with each face wound counter-clockwise seen from
 * outside, its normals, its edges grouped by direction, its volume and its inertia (for a density of 1;
 * the solids here are symmetric, so only the diagonal is kept).
 */
function mkShape(pts, faces) {
  const mid = [0, 1, 2].map(d => pts.reduce((s, p) => s + p[d], 0) / pts.length);
  const fs = faces.map(f => (dot(cross(sub(pts[f[1]], pts[f[0]]), sub(pts[f[2]], pts[f[0]])), sub(pts[f[0]], mid)) < 0 ? f.slice().reverse() : f.slice()));
  const tris = [];
  for (const f of fs) for (let i = 1; i + 1 < f.length; i++) tris.push([f[0], f[i], f[i + 1]]);
  let vol = 0; const cm = [0, 0, 0];
  for (const [i, j, k] of tris) { const a = pts[i], b = pts[j], c = pts[k], v = dot(a, cross(b, c)) / 6; vol += v; for (let d = 0; d < 3; d++) cm[d] += v * (a[d] + b[d] + c[d]) / 4; }
  const p = pts.map(q => [q[0] - cm[0] / vol, q[1] - cm[1] / vol, q[2] - cm[2] / vol]);
  const sq = [0, 0, 0];
  for (const [i, j, k] of tris) {
    const a = p[i], b = p[j], c = p[k], v = dot(a, cross(b, c)) / 60;
    for (let d = 0; d < 3; d++) sq[d] += v * (a[d] * a[d] + b[d] * b[d] + c[d] * c[d] + a[d] * b[d] + a[d] * c[d] + b[d] * c[d]);
  }
  const nrm = fs.map(f => { const n = cross(sub(p[f[1]], p[f[0]]), sub(p[f[2]], p[f[0]])), l = Math.sqrt(dot(n, n)); return [n[0] / l, n[1] / l, n[2] / l]; });
  const dirs = [], seen = new Set();
  for (const f of fs) for (let i = 0; i < f.length; i++) {
    const a = f[i], b = f[(i + 1) % f.length], key = a < b ? a * 1000 + b : b * 1000 + a;
    if (seen.has(key)) continue;
    seen.add(key);
    const e = sub(p[b], p[a]), l = Math.sqrt(dot(e, e)), d = [e[0] / l, e[1] / l, e[2] / l];
    const g = dirs.find(x => { const k = dot(x.d, d); return k > 0.9999 || k < -0.9999; });
    if (g) g.edges.push([a, b]); else dirs.push({ d, edges: [[a, b]] });
  }
  return { p, faces: fs, nrm, dirs, vol, inertia: [sq[1] + sq[2], sq[0] + sq[2], sq[0] + sq[1]], nv: p.length, r: Math.sqrt(Math.max(...p.map(q => dot(q, q)))) };
}
/** A box. Its faces come in this order: under, over, back (−z), right (+x), front (+z), left (−x). */
const box = (w, h, d) => mkShape([[-w / 2, -h / 2, -d / 2], [w / 2, -h / 2, -d / 2], [w / 2, -h / 2, d / 2], [-w / 2, -h / 2, d / 2], [-w / 2, h / 2, -d / 2], [w / 2, h / 2, -d / 2], [w / 2, h / 2, d / 2], [-w / 2, h / 2, d / 2]],
  [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]);
/** The points of a circle of n steps, each turned from the last by the angle of cosine c1 and sine s1 (no trigonometry: the same in every browser). */
function circle(n, c1, s1) { const out = []; let c = 1, s = 0; for (let i = 0; i < n; i++) { out.push([c, s]); const t = c * c1 - s * s1; s = s * c1 + c * s1; c = t; } return out; }
/** A prism over a polygon of points [x, z], h tall. */
function prism(ring, h) {
  const n = ring.length, pts = [...ring.map(([x, z]) => [x, h / 2, z]), ...ring.map(([x, z]) => [x, -h / 2, z])];
  return mkShape(pts, [ring.map((_, i) => i), ring.map((_, i) => n + i), ...ring.map((_, i) => [i, (i + 1) % n, n + (i + 1) % n, n + i])]);
}
/** A flat shape of points [x, y] pulled along z, d deep: the 2D game's triangle and hexagon, given a depth. */
function extrude(shape, d) {
  const n = shape.length, pts = [...shape.map(([x, y]) => [x, y, d / 2]), ...shape.map(([x, y]) => [x, y, -d / 2])];
  return mkShape(pts, [shape.map((_, i) => i), shape.map((_, i) => n + i), ...shape.map((_, i) => [i, (i + 1) % n, n + (i + 1) % n, n + i])]);
}
/** Half a ball of radius r, flat side down, cut in facets: eight sides at its foot, eight more half way up, and its top. */
function dome(r) {
  const ring = circle(8, C45, C45);
  return mkShape([...ring.map(([c, s]) => [c * r, 0, s * r]), ...ring.map(([c, s]) => [c * r * C45, r * C45, s * r * C45]), [0, r, 0]],
    [[0, 1, 2, 3, 4, 5, 6, 7], ...ring.map((_, i) => [i, (i + 1) % 8, 8 + (i + 1) % 8, 8 + i]), ...ring.map((_, i) => [8 + i, 8 + (i + 1) % 8, 16])]);
}
/** A ball: the one thing here that is not a solid of flat faces. */
const ball = r => { const vol = 4.1887902047863905 * r * r * r, i = 0.4 * vol * r * r; return { ball: true, r, vol, inertia: [i, i, i], nv: 0, p: [], faces: [], nrm: [], dirs: [] }; };

/**
 * A piece's form: the solids it is made of (`hulls`: what touches) and the ones it is drawn with (`looks`:
 * the same ones, unless it is made of blocks), each with where its centre is from the piece's centre of
 * mass; its volume, how far it reaches from its centre (`r`) and the inverse of its inertia for a mass of
 * MASS (`ib`: xx, yy, zz, xy, xz, yz: an L is not symmetric, so all six are kept).
 */
function mkForm(hulls, looks = null) {
  let V = 0, cx = 0, cy = 0, cz = 0;
  for (const h of hulls) { const v = h.shape.vol; V += v; cx += v * h.x; cy += v * h.y; cz += v * h.z; }
  cx /= V; cy /= V; cz /= V;
  let a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, r = 0;
  const out = hulls.map(h => {
    const x = h.x - cx, y = h.y - cy, z = h.z - cz, v = h.shape.vol, I = h.shape.inertia;
    a += I[0] + v * (y * y + z * z); b += I[1] + v * (x * x + z * z); c += I[2] + v * (x * x + y * y); d -= v * x * y; e -= v * x * z; f -= v * y * z;
    if (h.shape.ball) r = Math.max(r, Math.sqrt(x * x + y * y + z * z) + h.shape.r);
    else for (const p of h.shape.p) r = Math.max(r, Math.sqrt((p[0] + x) * (p[0] + x) + (p[1] + y) * (p[1] + y) + (p[2] + z) * (p[2] + z)));
    return { shape: h.shape, lx: x, ly: y, lz: z };
  });
  const k = MASS / V; a *= k; b *= k; c *= k; d *= k; e *= k; f *= k;
  const det = a * (b * c - f * f) - d * (d * c - e * f) + e * (d * f - b * e);
  return { hulls: out, looks: looks ? looks.map(l => ({ shape: l.shape, lx: l.x - cx, ly: l.y - cy, lz: l.z - cz, hide: l.hide, seams: l.seams })) : out, vol: V, r,
    ib: [(b * c - f * f) / det, (a * c - e * e) / det, (a * b - d * d) / det, (e * f - d * c) / det, (d * f - b * e) / det, (d * e - a * f) / det], round: hulls.length === 1 && !!hulls[0].shape.ball };
}
/** The form of a piece that is one solid. */
const solid = shape => mkForm([{ shape, x: 0, y: 0, z: 0 }]);
/**
 * The form of a piece made of cubes of side a on a grid, one cube deep (an L, a T…: no single convex solid
 * is one). `cells` are its cubes, as [column, row]; `bars` the boxes it touches with, each { x, y, w, h }
 * in cubes (its centre and its size). It is drawn cube by cube, without the faces between two cubes
 * (`hide`) and without a line where two cubes meet flat (`seams`: per face, per edge).
 */
function blocks(a, cells, bars) {
  const has = (i, j) => cells.some(c => c[0] === i && c[1] === j), cube = box(a, a, a);
  const WAY = [[0, -1], [0, 1], null, [1, 0], null, [-1, 0]];   // where each face of a box looks, on the grid (front and back: off it)
  const looks = cells.map(([i, j]) => ({ shape: cube, x: i * a, y: j * a, z: 0,
    hide: WAY.map(d => !!d && has(i + d[0], j + d[1])),
    seams: cube.faces.map((f, fi) => f.map((v, k) => {
      // The other face that shares this edge, and the cube across it: a line is only drawn where the piece really has an edge
      const w = f[(k + 1) % f.length], e = WAY[cube.faces.findIndex((g, gi) => gi !== fi && g.includes(v) && g.includes(w))], d = WAY[fi];
      return !!e && has(i + e[0], j + e[1]) && (!d || !has(i + e[0] + d[0], j + e[1] + d[1]));
    })) }));
  return mkForm(bars.map(b => ({ shape: box(b.w * a, b.h * a, a), x: b.x * a, y: b.y * a, z: 0 })), looks);
}

/** The lists a placed solid keeps of itself in the world: corners, face normals, edge directions. */
const slots = sh => ({ px: new Array(sh.nv), py: new Array(sh.nv), pz: new Array(sh.nv), nx: new Array(sh.faces.length), ny: new Array(sh.faces.length), nz: new Array(sh.faces.length),
  dx: new Array(sh.dirs.length), dy: new Array(sh.dirs.length), dz: new Array(sh.dirs.length), minx: 0, maxx: 0, miny: 0, maxy: 0, minz: 0, maxz: 0 });

/**
 * A body: where its centre of mass is (x, y, z), how it is turned (a quaternion), how it moves (v) and
 * spins (o). It is made of `parts` (what touches) and drawn with `looks` (the same ones, or its `cells`
 * if it is made of blocks); its box (minx…maxz) holds all its parts.
 */
function mkBody(id, form, x, y, z, { fr = 0.5, re = 0 } = {}) {
  const b = { id, form, x, y, z, vx: 0, vy: 0, vz: 0, ox: 0, oy: 0, oz: 0, qw: 1, qx: 0, qy: 0, qz: 0, m: MASS, invM: 1 / MASS, ib: form.ib, r: IDENT.slice(), ii: [0, 0, 0, 0, 0, 0],
    fr, re, touch: false, round: form.round, parts: [], cells: [], looks: null, minx: 0, maxx: 0, miny: 0, maxy: 0, minz: 0, maxz: 0 };
  b.parts = form.hulls.map((h, k) => mkPart(b, id * 8 + k, h.shape, h.lx, h.ly, h.lz, IDENT, { fr, re }));
  if (form.looks !== form.hulls) b.cells = form.looks.map(l => mkPart(b, -1, l.shape, l.lx, l.ly, l.lz, IDENT, { hide: l.hide, seams: l.seams }));
  b.looks = b.cells.length ? b.cells : b.parts;
  place(b); return b;
}
/** The rotation matrix (b.r, by rows) from the quaternion. */
function turn(b) {
  const w = b.qw, x = b.qx, y = b.qy, z = b.qz, r = b.r;
  r[0] = 1 - 2 * (y * y + z * z); r[1] = 2 * (x * y - w * z); r[2] = 2 * (x * z + w * y);
  r[3] = 2 * (x * y + w * z); r[4] = 1 - 2 * (x * x + z * z); r[5] = 2 * (y * z - w * x);
  r[6] = 2 * (x * z - w * y); r[7] = 2 * (y * z + w * x); r[8] = 1 - 2 * (x * x + y * y);
}
/** World corners, normals, edge directions and bounding box of a placed solid from its position and rotation matrix. */
function spread(b) {
  const sh = b.shape, r = b.r;
  if (sh.ball) { b.minx = b.x - sh.r; b.maxx = b.x + sh.r; b.miny = b.y - sh.r; b.maxy = b.y + sh.r; b.minz = b.z - sh.r; b.maxz = b.z + sh.r; return; }
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < sh.nv; i++) {
    const p = sh.p[i], X = b.x + r[0] * p[0] + r[1] * p[1] + r[2] * p[2], Y = b.y + r[3] * p[0] + r[4] * p[1] + r[5] * p[2], Z = b.z + r[6] * p[0] + r[7] * p[1] + r[8] * p[2];
    b.px[i] = X; b.py[i] = Y; b.pz[i] = Z;
    if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; if (Z < z0) z0 = Z; if (Z > z1) z1 = Z;
  }
  for (let i = 0; i < sh.nrm.length; i++) { const n = sh.nrm[i]; b.nx[i] = r[0] * n[0] + r[1] * n[1] + r[2] * n[2]; b.ny[i] = r[3] * n[0] + r[4] * n[1] + r[5] * n[2]; b.nz[i] = r[6] * n[0] + r[7] * n[1] + r[8] * n[2]; }
  for (let i = 0; i < sh.dirs.length; i++) { const d = sh.dirs[i].d; b.dx[i] = r[0] * d[0] + r[1] * d[1] + r[2] * d[2]; b.dy[i] = r[3] * d[0] + r[4] * d[1] + r[5] * d[2]; b.dz[i] = r[6] * d[0] + r[7] * d[1] + r[8] * d[2]; }
  b.minx = x0; b.maxx = x1; b.miny = y0; b.maxy = y1; b.minz = z0; b.maxz = z1;
}
/** Everything a body derives from its position and quaternion: where its parts are, its box, and its inverse inertia in the world (ii: xx, yy, zz, xy, xz, yz). */
function place(b) {
  turn(b);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const q of b.parts) { seat(q); if (q.minx < x0) x0 = q.minx; if (q.maxx > x1) x1 = q.maxx; if (q.miny < y0) y0 = q.miny; if (q.maxy > y1) y1 = q.maxy; if (q.minz < z0) z0 = q.minz; if (q.maxz > z1) z1 = q.maxz; }
  for (const q of b.cells) seat(q);
  b.minx = x0; b.maxx = x1; b.miny = y0; b.maxy = y1; b.minz = z0; b.maxz = z1;
  // R · A · Rᵀ, with A the inverse inertia in the body's own axes
  const r = b.r, A = b.ib, i = b.ii;
  const m00 = r[0] * A[0] + r[1] * A[3] + r[2] * A[4], m01 = r[0] * A[3] + r[1] * A[1] + r[2] * A[5], m02 = r[0] * A[4] + r[1] * A[5] + r[2] * A[2];
  const m10 = r[3] * A[0] + r[4] * A[3] + r[5] * A[4], m11 = r[3] * A[3] + r[4] * A[1] + r[5] * A[5], m12 = r[3] * A[4] + r[4] * A[5] + r[5] * A[2];
  const m20 = r[6] * A[0] + r[7] * A[3] + r[8] * A[4], m21 = r[6] * A[3] + r[7] * A[1] + r[8] * A[5], m22 = r[6] * A[4] + r[7] * A[5] + r[8] * A[2];
  i[0] = m00 * r[0] + m01 * r[1] + m02 * r[2]; i[1] = m10 * r[3] + m11 * r[4] + m12 * r[5]; i[2] = m20 * r[6] + m21 * r[7] + m22 * r[8];
  i[3] = m00 * r[3] + m01 * r[4] + m02 * r[5]; i[4] = m00 * r[6] + m01 * r[7] + m02 * r[8]; i[5] = m10 * r[6] + m11 * r[7] + m12 * r[8];
}

/**
 * A part: a solid fixed to what owns it (a body, or the disc) at (lx, ly, lz) from its centre, turned by
 * the matrix `lr`. A piece is made of them; the disc itself and its wall are parts of the disc, and so
 * is every piece of the pile once it is buried: it stops being a body of its own and its parts become
 * the disc's, which carries its weight.
 */
function mkPart(pl, id, shape, lx, ly, lz, lr, o) {
  const q = Object.assign({ id, shape, owner: pl, lx, ly, lz, lr, r: new Array(9), x: 0, y: 0, z: 0, fr: 0.5, re: 0, m: 0 }, slots(shape), o);
  seat(q); return q;
}
/** Puts a part where its owner carries it. */
function seat(q) {
  const pl = q.owner, P = pl.r, l = q.lr, r = q.r;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[3 * i + j] = P[3 * i] * l[j] + P[3 * i + 1] * l[3 + j] + P[3 * i + 2] * l[6 + j];
  q.x = pl.x + P[0] * q.lx + P[1] * q.ly + P[2] * q.lz; q.y = pl.y + P[3] * q.lx + P[4] * q.ly + P[5] * q.lz; q.z = pl.z + P[6] * q.lx + P[7] * q.ly + P[8] * q.lz;
  spread(q);
}

/* What the last separating-axis test found: the axis from A to B (sX, sY, sZ), how far apart they are along it (sS: negative when they overlap) and what it is: a face of A (0), a face of B (1) or a pair of edges (2), and which (sI, sJ). */
let sK = 0, sI = 0, sJ = 0, sS = 0, sX = 0, sY = 0, sZ = 0;
/**
 * The separating-axis test between two placed solids: false if a plane parts them (and then the axis
 * is that plane's normal), true if they overlap (and then it is the axis of least overlap). The axes
 * are the faces of each and the cross products of their edge directions.
 */
function sat(A, B) {
  const a = A.shape, b = B.shape, na = a.nv, nb = b.nv;
  let fa = -Infinity, ia = 0, fb = -Infinity, ib = 0;
  for (let i = 0; i < a.faces.length; i++) {
    const nx = A.nx[i], ny = A.ny[i], nz = A.nz[i], v = a.faces[i][0], d = nx * A.px[v] + ny * A.py[v] + nz * A.pz[v];
    let m = Infinity;
    for (let j = 0; j < nb; j++) { const s = nx * B.px[j] + ny * B.py[j] + nz * B.pz[j] - d; if (s < m) m = s; }
    if (m > 0) { sK = 0; sI = i; sS = m; sX = nx; sY = ny; sZ = nz; return false; }
    if (m > fa) { fa = m; ia = i; }
  }
  for (let i = 0; i < b.faces.length; i++) {
    const nx = B.nx[i], ny = B.ny[i], nz = B.nz[i], v = b.faces[i][0], d = nx * B.px[v] + ny * B.py[v] + nz * B.pz[v];
    let m = Infinity;
    for (let j = 0; j < na; j++) { const s = nx * A.px[j] + ny * A.py[j] + nz * A.pz[j] - d; if (s < m) m = s; }
    if (m > 0) { sK = 1; sI = i; sS = m; sX = -nx; sY = -ny; sZ = -nz; return false; }
    if (m > fb) { fb = m; ib = i; }
  }
  let fe = -Infinity, ie = 0, je = 0, ex = 0, ey = 0, ez = 0;
  for (let i = 0; i < a.dirs.length; i++) for (let j = 0; j < b.dirs.length; j++) {
    let cx = A.dy[i] * B.dz[j] - A.dz[i] * B.dy[j], cy = A.dz[i] * B.dx[j] - A.dx[i] * B.dz[j], cz = A.dx[i] * B.dy[j] - A.dy[i] * B.dx[j];
    const l2 = cx * cx + cy * cy + cz * cz;
    if (l2 < 1e-6) continue;
    const l = 1 / Math.sqrt(l2); cx *= l; cy *= l; cz *= l;
    let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (let k = 0; k < na; k++) { const s = cx * A.px[k] + cy * A.py[k] + cz * A.pz[k]; if (s < a0) a0 = s; if (s > a1) a1 = s; }
    for (let k = 0; k < nb; k++) { const s = cx * B.px[k] + cy * B.py[k] + cz * B.pz[k]; if (s < b0) b0 = s; if (s > b1) b1 = s; }
    // B past A along the axis, or against it: whichever way they overlap less
    const s1 = b0 - a1, s2 = a0 - b1, s = s1 > s2 ? s1 : s2, g = s1 > s2 ? 1 : -1;
    if (s > 0) { sK = 2; sI = i; sJ = j; sS = s; sX = g * cx; sY = g * cy; sZ = g * cz; return false; }
    if (s > fe) { fe = s; ie = i; je = j; ex = g * cx; ey = g * cy; ez = g * cz; }
  }
  // A face is preferred: two edges only when they overlap clearly less than any face (two faces flat on each other give all three about the same)
  if (fe > (fa > fb ? fa : fb) + 0.005) { sK = 2; sI = ie; sJ = je; sS = fe; sX = ex; sY = ey; sZ = ez; }
  else if (fb > fa + 0.002) { sK = 1; sI = ib; sS = fb; sX = -B.nx[ib]; sY = -B.ny[ib]; sZ = -B.nz[ib]; }
  else { sK = 0; sI = ia; sS = fa; sX = A.nx[ia]; sY = A.ny[ia]; sZ = A.nz[ia]; }
  return true;
}

/* Where a ball touches: the closest point of the other solid (or of the first ball). */
let cX = 0, cY = 0, cZ = 0;
/**
 * A ball B against a convex solid P. Sets the axis from P to the ball, how far apart they are along it
 * (negative when they overlap) and the point of P closest to the ball's centre; true if they overlap.
 */
function ballPoly(P, B) {
  const sh = P.shape, bx = B.x, by = B.y, bz = B.z, r = B.shape.r;
  let dm = -Infinity, im = 0;
  for (let i = 0; i < sh.faces.length; i++) {
    const v = sh.faces[i][0], d = P.nx[i] * (bx - P.px[v]) + P.ny[i] * (by - P.py[v]) + P.nz[i] * (bz - P.pz[v]);
    if (d > dm) { dm = d; im = i; }
  }
  sK = 0; sI = im;
  if (dm > r || dm <= 0) {
    // Clear of it past one face (that face's plane parts them), or its centre is inside: that face's normal either way
    sX = P.nx[im]; sY = P.ny[im]; sZ = P.nz[im]; sS = dm - r;
    cX = bx - sX * dm; cY = by - sY * dm; cZ = bz - sZ * dm;
    return dm <= 0;
  }
  // Its centre is outside, within reach: the closest point of the solid is on one of the faces the centre is in front of
  let best = Infinity;
  for (let i = 0; i < sh.faces.length; i++) {
    const f = sh.faces[i], nx = P.nx[i], ny = P.ny[i], nz = P.nz[i], v0 = f[0], d = nx * (bx - P.px[v0]) + ny * (by - P.py[v0]) + nz * (bz - P.pz[v0]);
    if (d <= 0 || d > r) continue;
    // The centre brought down onto the face's plane; if that is past an edge, the closest point of that edge instead
    const qx = bx - nx * d, qy = by - ny * d, qz = bz - nz * d;
    let near = Infinity, ex = qx, ey = qy, ez = qz, out = false;
    for (let k = 0; k < f.length; k++) {
      const a = f[k], b = f[(k + 1) % f.length], ax = P.px[a], ay = P.py[a], az = P.pz[a], ux = P.px[b] - ax, uy = P.py[b] - ay, uz = P.pz[b] - az, wx = qx - ax, wy = qy - ay, wz = qz - az;
      if ((uy * wz - uz * wy) * nx + (uz * wx - ux * wz) * ny + (ux * wy - uy * wx) * nz >= 0) continue;
      out = true;
      const t = clamp01((ux * wx + uy * wy + uz * wz) / (ux * ux + uy * uy + uz * uz)), px = ax + ux * t, py = ay + uy * t, pz = az + uz * t, d2 = (bx - px) * (bx - px) + (by - py) * (by - py) + (bz - pz) * (bz - pz);
      if (d2 < near) { near = d2; ex = px; ey = py; ez = pz; }
    }
    if (!out) near = d * d;
    if (near < best) { best = near; cX = ex; cY = ey; cZ = ez; }
  }
  const dist = Math.sqrt(best);
  if (dist < 1e-9) { sX = P.nx[im]; sY = P.ny[im]; sZ = P.nz[im]; } else { sX = (bx - cX) / dist; sY = (by - cY) / dist; sZ = (bz - cZ) / dist; }
  sS = dist - r;
  return sS < 0;
}
/** Whether two placed solids overlap, either of which may be a ball; sets the axis from A to B and how far apart they are along it, as `sat` does. */
function meets(A, B) {
  const ba = A.shape.ball, bb = B.shape.ball;
  if (!ba && !bb) return sat(A, B);
  if (ba && bb) {
    const dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    sK = 0; sS = d - A.shape.r - B.shape.r;
    if (d < 1e-9) { sX = 0; sY = 1; sZ = 0; } else { sX = dx / d; sY = dy / d; sZ = dz / d; }
    cX = A.x + sX * A.shape.r; cY = A.y + sY * A.shape.r; cZ = A.z + sZ * A.shape.r;
    return sS < 0;
  }
  if (bb) return ballPoly(A, B);
  const hit = ballPoly(B, A); sX = -sX; sY = -sY; sZ = -sZ;
  return hit;
}

/**
 * A contact: the normal (nx, ny, nz) goes from a to b. A and B are what touch: a body, or a part of the
 * disc, and then the body that takes the push is the disc (its `owner`).
 */
const con = (A, B, nx, ny, nz, px, py, pz, pen) => ({ a: A.owner || A, b: B.owner || B, key: A.id * 65536 + B.id, nx, ny, nz, px, py, pz, pen, fr: Math.sqrt(A.fr * B.fr), re: A.re > B.re ? A.re : B.re,
  pn: 0, p1: 0, p2: 0, rax: 0, ray: 0, raz: 0, rbx: 0, rby: 0, rbz: 0, t1x: 0, t1y: 0, t1z: 0, t2x: 0, t2y: 0, t2z: 0, mn: 0, m1: 0, m2: 0, bias: 0 });

/** The part of a polygon on the inner side of a plane (s · p ≤ d). */
function clip(poly, sx, sy, sz, d) {
  const out = [];
  let p = poly[poly.length - 1], dp = sx * p[0] + sy * p[1] + sz * p[2] - d;
  for (const q of poly) {
    const dq = sx * q[0] + sy * q[1] + sz * q[2] - d;
    if ((dq <= 0) !== (dp <= 0)) { const t = dp / (dp - dq); out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1]), p[2] + t * (q[2] - p[2])]); }
    if (dq <= 0) out.push(q);
    p = q; dp = dq;
  }
  return out;
}
/** Of a solid's edges along one of its directions, the one furthest along the axis (sign 1) or against it (−1). */
function support(S, k, sign) {
  let best = null, m = -Infinity;
  for (const e of S.shape.dirs[k].edges) {
    const s = sign * (sX * (S.px[e[0]] + S.px[e[1]]) + sY * (S.py[e[0]] + S.py[e[1]]) + sZ * (S.pz[e[0]] + S.pz[e[1]]));
    if (s > m) { m = s; best = e; }
  }
  return best;
}
const clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Where two placed solids touch, added to `out`: up to a whole patch when a face lies on a face, one point for two edges. */
function collide(A, B, out) {
  // A ball touches at one point: the closest one
  if (A.shape.ball || B.shape.ball) { if (meets(A, B)) out.push(con(A, B, sX, sY, sZ, cX, cY, cZ, -sS)); return; }
  if (!sat(A, B)) return;
  if (sK === 2) {
    // Two edges: the closest points of the two segments
    const ea = support(A, sI, 1), eb = support(B, sJ, -1);
    const p1x = A.px[ea[0]], p1y = A.py[ea[0]], p1z = A.pz[ea[0]], d1x = A.px[ea[1]] - p1x, d1y = A.py[ea[1]] - p1y, d1z = A.pz[ea[1]] - p1z;
    const p2x = B.px[eb[0]], p2y = B.py[eb[0]], p2z = B.pz[eb[0]], d2x = B.px[eb[1]] - p2x, d2y = B.py[eb[1]] - p2y, d2z = B.pz[eb[1]] - p2z;
    const rx = p1x - p2x, ry = p1y - p2y, rz = p1z - p2z;
    const a = d1x * d1x + d1y * d1y + d1z * d1z, e = d2x * d2x + d2y * d2y + d2z * d2z, f = d2x * rx + d2y * ry + d2z * rz, c = d1x * rx + d1y * ry + d1z * rz, b = d1x * d2x + d1y * d2y + d1z * d2z;
    const den = a * e - b * b;
    let s = den > 1e-12 ? clamp01((b * f - c * e) / den) : 0, t = (b * s + f) / e;
    if (t < 0) { t = 0; s = clamp01(-c / a); } else if (t > 1) { t = 1; s = clamp01((b - c) / a); }
    out.push(con(A, B, sX, sY, sZ, (p1x + d1x * s + p2x + d2x * t) / 2, (p1y + d1y * s + p2y + d2y * t) / 2, (p1z + d1z * s + p2z + d2z * t) / 2, -sS));
    return;
  }
  // A face: the other solid's face that looks at it most, cut to the face's outline, gives the patch
  const R = sK ? B : A, I = sK ? A : B, f = R.shape.faces[sI], nx = R.nx[sI], ny = R.ny[sI], nz = R.nz[sI], g = sK ? -1 : 1;
  let fi = 0, md = Infinity;
  for (let k = 0; k < I.nx.length; k++) { const d = nx * I.nx[k] + ny * I.ny[k] + nz * I.nz[k]; if (d < md) { md = d; fi = k; } }
  let poly = I.shape.faces[fi].map(v => [I.px[v], I.py[v], I.pz[v]]);
  for (let k = 0; k < f.length && poly.length; k++) {
    const v1 = f[k], v2 = f[(k + 1) % f.length], ex = R.px[v2] - R.px[v1], ey = R.py[v2] - R.py[v1], ez = R.pz[v2] - R.pz[v1];
    const sx = ey * nz - ez * ny, sy = ez * nx - ex * nz, sz = ex * ny - ey * nx;
    poly = clip(poly, sx, sy, sz, sx * R.px[v1] + sy * R.py[v1] + sz * R.pz[v1]);
  }
  const d = nx * R.px[f[0]] + ny * R.py[f[0]] + nz * R.pz[f[0]];
  for (const p of poly) {
    // A corner a hair above the face still counts (with a negative depth: it only stops what would go through), so a resting patch keeps all its corners
    const sep = nx * p[0] + ny * p[1] + nz * p[2] - d;
    if (sep <= SPEC) out.push(con(A, B, g * nx, g * ny, g * nz, p[0] - nx * sep, p[1] - ny * sep, p[2] - nz * sep, -sep));
  }
}

const T = [0, 0, 0];
/** A body's inverse inertia applied to (x, y, z): the result in T. */
function spin(b, x, y, z) { const i = b.ii; T[0] = i[0] * x + i[3] * y + i[4] * z; T[1] = i[3] * x + i[1] * y + i[5] * z; T[2] = i[4] * x + i[5] * y + i[2] * z; }
/** How much a contact resists a push along (x, y, z): the inverse of the two bodies' give there. */
function give(k, x, y, z) {
  const a = k.a, b = k.b;
  let cx = k.ray * z - k.raz * y, cy = k.raz * x - k.rax * z, cz = k.rax * y - k.ray * x;
  spin(a, cx, cy, cz);
  let s = a.invM + b.invM + cx * T[0] + cy * T[1] + cz * T[2];
  cx = k.rby * z - k.rbz * y; cy = k.rbz * x - k.rbx * z; cz = k.rbx * y - k.rby * x;
  spin(b, cx, cy, cz);
  s += cx * T[0] + cy * T[1] + cz * T[2];
  return 1 / s;
}
/** The impulse (x, y, z) at a contact: on b, and its opposite on a. */
function push(k, x, y, z) {
  const a = k.a, b = k.b;
  a.vx -= a.invM * x; a.vy -= a.invM * y; a.vz -= a.invM * z;
  spin(a, k.ray * z - k.raz * y, k.raz * x - k.rax * z, k.rax * y - k.ray * x);
  a.ox -= T[0]; a.oy -= T[1]; a.oz -= T[2];
  b.vx += b.invM * x; b.vy += b.invM * y; b.vz += b.invM * z;
  spin(b, k.rby * z - k.rbz * y, k.rbz * x - k.rbx * z, k.rbx * y - k.rby * x);
  b.ox += T[0]; b.oy += T[1]; b.oz += T[2];
}
/** How fast b moves past a at a contact, along (x, y, z). */
function slip(k, x, y, z) {
  const a = k.a, b = k.b;
  return (b.vx + b.oy * k.rbz - b.oz * k.rby - a.vx - a.oy * k.raz + a.oz * k.ray) * x
    + (b.vy + b.oz * k.rbx - b.ox * k.rbz - a.vy - a.oz * k.rax + a.ox * k.raz) * y
    + (b.vz + b.ox * k.rby - b.oy * k.rbx - a.vz - a.ox * k.ray + a.oy * k.rax) * z;
}

/**
 * One step of the world W: { bodies, plat, prev, K, D, smax }. `bodies` are the loose pieces. The disc
 * (`plat`) cannot move, only lean about its pivot, with its parts: `u` is its up direction, a spring
 * (K) pulls it level and a damper (D) calms it; `load` is the weight welded to it, as mass × arm, and
 * `mass` how much that is; `smax` is the sine of the lean where it stops. It does not spin about the
 * vertical: its inverse inertia has no y.
 *
 * The spring and the damper grow with the welded mass (× 1 + mass / SPRING_M), so the lean goes by how
 * far off centre the pile's weight is, whatever its size.
 */
function stepWorld(W) {
  const bs = W.bodies, pl = W.plat;
  for (const b of bs) { b.touch = false; b.vy -= GRAV * DT; }
  {
    const k = (1 + pl.mass / SPRING_M) * PLAT_I * pl.ii[0], r = pl.r, L = pl.load;
    const lx = r[0] * L[0] + r[1] * L[1] + r[2] * L[2], lz = r[6] * L[0] + r[7] * L[1] + r[8] * L[2];
    pl.ox += ((-W.K * pl.uz - W.D * pl.ox) * k + GRAV * lz * pl.ii[0]) * DT;
    pl.oz += ((W.K * pl.ux - W.D * pl.oz) * k - GRAV * lx * pl.ii[0]) * DT;
  }

  // What touches what: part against part, of the pairs whose boxes overlap
  const cs = [], near = (p, q) => !(p.maxx < q.minx || q.maxx < p.minx || p.maxy < q.miny || q.maxy < p.miny || p.maxz < q.minz || q.maxz < p.minz);
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i];
    for (const q of pl.parts) if (near(q, b)) for (const h of b.parts) if (near(q, h)) collide(q, h, cs);
    for (let j = i + 1; j < bs.length; j++) {
      const a = bs[j];
      if (near(a, b)) for (const h of b.parts) for (const g of a.parts) if (near(h, g)) collide(h, g, cs);
    }
  }

  for (const k of cs) {
    const a = k.a, b = k.b;
    k.rax = k.px - a.x; k.ray = k.py - a.y; k.raz = k.pz - a.z; k.rbx = k.px - b.x; k.rby = k.py - b.y; k.rbz = k.pz - b.z;
    // Two directions along the surface, for the friction
    let tx, ty, tz;
    if (k.nx * k.nx < 0.33) { tx = 0; ty = k.nz; tz = -k.ny; } else { tx = -k.nz; ty = 0; tz = k.nx; }
    const l = 1 / Math.sqrt(tx * tx + ty * ty + tz * tz);
    k.t1x = tx * l; k.t1y = ty * l; k.t1z = tz * l;
    k.t2x = k.ny * k.t1z - k.nz * k.t1y; k.t2y = k.nz * k.t1x - k.nx * k.t1z; k.t2z = k.nx * k.t1y - k.ny * k.t1x;
    k.mn = give(k, k.nx, k.ny, k.nz); k.m1 = give(k, k.t1x, k.t1y, k.t1z); k.m2 = give(k, k.t2x, k.t2y, k.t2z);
    k.bias = k.pen < 0 ? k.pen / DT : Math.min(MAX_BIAS, BETA / DT * Math.max(0, k.pen - SLOP));
    const vn = slip(k, k.nx, k.ny, k.nz);
    if (vn < -REST_V && -k.re * vn > k.bias) k.bias = -k.re * vn;
    // The push it ended the last step with, if it was there (the same pair, at about the same place)
    const old = W.prev.get(k.key);
    if (old) for (const o of old) {
      const ex = o.x - k.px, ey = o.y - k.py, ez = o.z - k.pz;
      if (o.used || ex * ex + ey * ey + ez * ez > 0.0009) continue;
      o.used = true;
      k.pn = Math.max(0, o.ix * k.nx + o.iy * k.ny + o.iz * k.nz); k.p1 = o.ix * k.t1x + o.iy * k.t1y + o.iz * k.t1z; k.p2 = o.ix * k.t2x + o.iy * k.t2y + o.iz * k.t2z;
      push(k, k.pn * k.nx + k.p1 * k.t1x + k.p2 * k.t2x, k.pn * k.ny + k.p1 * k.t1y + k.p2 * k.t2y, k.pn * k.nz + k.p1 * k.t1z + k.p2 * k.t2z);
      break;
    }
  }
  for (let it = 0; it < ITER; it++) for (const k of cs) {
    let d = k.mn * (k.bias - slip(k, k.nx, k.ny, k.nz)); const pn0 = k.pn;
    k.pn = Math.max(pn0 + d, 0); d = k.pn - pn0;
    push(k, d * k.nx, d * k.ny, d * k.nz);
    const max = k.fr * k.pn;
    d = -k.m1 * slip(k, k.t1x, k.t1y, k.t1z); const q1 = k.p1;
    k.p1 = Math.max(-max, Math.min(max, q1 + d)); d = k.p1 - q1;
    push(k, d * k.t1x, d * k.t1y, d * k.t1z);
    d = -k.m2 * slip(k, k.t2x, k.t2y, k.t2z); const q2 = k.p2;
    k.p2 = Math.max(-max, Math.min(max, q2 + d)); d = k.p2 - q2;
    push(k, d * k.t2x, d * k.t2y, d * k.t2z);
  }
  const now = new Map();
  for (const k of cs) {
    if (k.pn > 0) { k.a.touch = true; k.b.touch = true; }
    let list = now.get(k.key); if (!list) now.set(k.key, list = []);
    list.push({ x: k.px, y: k.py, z: k.pz, ix: k.pn * k.nx + k.p1 * k.t1x + k.p2 * k.t2x, iy: k.pn * k.ny + k.p1 * k.t1y + k.p2 * k.t2y, iz: k.pn * k.nz + k.p1 * k.t1z + k.p2 * k.t2z, used: false, pn: k.pn });
  }
  W.prev = now;

  // The disc leans: its up direction turns with its spin, and stops at its limit
  {
    const x = pl.ux - pl.oz * pl.uy * DT, y = pl.uy + (pl.oz * pl.ux - pl.ox * pl.uz) * DT, z = pl.uz + pl.ox * pl.uy * DT, l = 1 / Math.sqrt(x * x + y * y + z * z);
    pl.ux = x * l; pl.uy = y * l; pl.uz = z * l;
    const s2 = pl.ux * pl.ux + pl.uz * pl.uz;
    if (s2 > W.smax * W.smax) {
      const s = Math.sqrt(s2), k = W.smax / s, out = (pl.ox * pl.uz - pl.oz * pl.ux) / s;
      if (out > 0) { pl.ox -= out * pl.uz / s; pl.oz += out * pl.ux / s; }
      pl.ux *= k; pl.uz *= k; pl.uy = Math.sqrt(1 - W.smax * W.smax);
    }
    lean(pl);
  }
  for (const b of bs) {
    // What touches something settles instead of rattling on. A ball rolls on: it only loses a steady bit of spin, so it rests on a level floor
    const kv = b.touch ? (b.round ? 1.2 : 2) : 0.02, ko = b.touch ? (b.round ? 0.6 : 5) : 0.3;
    if (b.round && b.touch) { const w = Math.sqrt(b.ox * b.ox + b.oy * b.oy + b.oz * b.oz), k = w > ROLL * DT ? 1 - ROLL * DT / w : 0; b.ox *= k; b.oy *= k; b.oz *= k; }
    b.vx *= 1 - kv * DT; b.vy *= 1 - kv * DT; b.vz *= 1 - kv * DT; b.ox *= 1 - ko * DT; b.oy *= 1 - ko * DT; b.oz *= 1 - ko * DT;
    b.x += b.vx * DT; b.y += b.vy * DT; b.z += b.vz * DT;
    const h = 0.5 * DT, w = b.qw - h * (b.ox * b.qx + b.oy * b.qy + b.oz * b.qz), x = b.qx + h * (b.ox * b.qw + b.oy * b.qz - b.oz * b.qy),
      y = b.qy + h * (b.oy * b.qw + b.oz * b.qx - b.ox * b.qz), z = b.qz + h * (b.oz * b.qw + b.ox * b.qy - b.oy * b.qx), l = 1 / Math.sqrt(w * w + x * x + y * y + z * z);
    b.qw = w * l; b.qx = x * l; b.qy = y * l; b.qz = z * l;
    place(b);
  }
}
/** The disc's rotation from its up direction (the shortest turn from the vertical, so it never spins about it), and its parts with it. */
function lean(pl) {
  const w = 1 + pl.uy, l = 1 / Math.sqrt(w * w + pl.uz * pl.uz + pl.ux * pl.ux);
  pl.qw = w * l; pl.qx = pl.uz * l; pl.qy = 0; pl.qz = -pl.ux * l;
  turn(pl);
  for (const q of pl.parts) seat(q);
  for (const q of pl.cells) seat(q);
}

/* ================================================================== */
/* The game: an endless pile, the hand, the score                      */
/* ================================================================== */
const RAD = 1.05, TH = 0.08, RIM = 0.12, RIM_W = 0.07, PLAT_I = 2.2, SPRING_M = 5, JUDGE_S = 1.4, PERFECT = 0.05;
/** Going over: leaning past TIP (its sine: about 27°) for TIP_S seconds in all; past WARN (20°) the player is warned. Once over, it keeps tipping at TIP_A. */
const TIP = 0.45, TIP_S = 0.35, WARN = 0.34, TIP_A = 5;
/** How many pieces stay loose on top of the pile (the ones under them are welded to the disc), how far above the pile the hand holds the next one, how far from the centre it reaches (never past the wall), how low a piece is lost, and how fast a piece let go comes down (it is lowered, not thrown: however far it has to go, it lands as hard). */
const LOOSE = 5, CLEAR = 1.15, REACH = RAD - RIM_W - 0.03, FALL_Y = -0.9, FALL_V = 3.2;
const C75 = 0.9914448613738104, S75 = 0.13052619222005157;   // cosine and sine of 7.5°
const RING = circle(48, C75, S75), DISC = prism(RING.filter((_, i) => i % 2 === 0).map(([x, z]) => [x * RAD, z * RAD]), TH), RIM_BOX = box(2 * RAD * S75 * 1.06, RIM, RIM_W);

/**
 * The pieces: the 2D game's ten kinds, each a shape of its own, given a depth (its square is a cube here,
 * its triangle and its hexagon are pulled out into prisms, its L, T, Z and cross are one cube deep). They
 * all weigh the same (MASS), whatever their size, and grip the same. Their names and what the player is
 * told when one first shows up are in the texts (`b3K_…`, `b3T_…`).
 */
const HEX = [[1, 0], [0.5, SIN60], [-0.5, SIN60], [-1, 0], [-0.5, -SIN60], [0.5, -SIN60]];
const KINDS = {
  cubo: { color: [46, 230, 214], form: k => solid(box(0.34 * k, 0.34 * k, 0.34 * k)) },
  ladrillo: { color: [255, 46, 136], form: k => solid(box(0.62 * k, 0.2 * k, 0.3 * k)) },
  triangulo: { color: [157, 255, 58], form: k => solid(extrude([[0, 0.44 * SIN60 * k], [0.22 * k, 0], [-0.22 * k, 0]], 0.34 * k)) },
  ele: { color: [106, 168, 255], form: (k, flip) => { const f = flip ? -1 : 1; return blocks(0.19 * k, [[0, -1], [0, 0], [0, 1], [f, -1]], [{ x: 0, y: 0, w: 1, h: 3 }, { x: f, y: -1, w: 1, h: 1 }]); } },
  bola: { color: [255, 210, 63], form: k => solid(ball(0.17 * k)) },
  te: { color: [176, 124, 255], form: k => blocks(0.19 * k, [[-1, 0], [0, 0], [1, 0], [0, 1]], [{ x: 0, y: 0, w: 3, h: 1 }, { x: 0, y: 1, w: 1, h: 1 }]) },
  domo: { color: [255, 122, 26], form: k => solid(dome(0.24 * k)) },
  hexagono: { color: [143, 227, 255], form: k => solid(extrude(HEX.map(([x, y]) => [x * 0.2 * k, y * 0.2 * k]), 0.3 * k)) },
  zeta: { color: [233, 228, 255], form: (k, flip) => { const f = flip ? -1 : 1; return blocks(0.19 * k, [[-f, 1], [0, 1], [0, 0], [f, 0]], [{ x: -f / 2, y: 1, w: 2, h: 1 }, { x: f / 2, y: 0, w: 2, h: 1 }]); } },
  cruz: { color: [255, 143, 189], form: k => blocks(0.17 * k, [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]], [{ x: 0, y: 0, w: 3, h: 1 }, { x: 0, y: 1, w: 1, h: 1 }, { x: 0, y: -1, w: 1, h: 1 }]) },
};
/** A piece's form from its spec { kind, k (scale), flip (an L or a Z the other way round) }. */
const formFor = spec => KINDS[spec.kind].form(spec.k, spec.flip);
/**
 * When each kind comes: the 2D game's schedule, as it is there (the owner's: new shapes one at a time and well apart).
 * The first pieces are only the three everyday ones: squares to begin with, the brick from the 3rd piece and the
 * triangle from the 6th. The special ones come one at a time, each on a turn of its own, and no other piece is one:
 * the first two a little early (the 8th and the 12th piece), then a new kind every fifth piece (the 17th, 22nd… 37th),
 * in SPECIAL's order. Once all have come they keep taking a turn every fifth piece, in the same order.
 *
 * Among the everyday ones a triangle is one in eight (WEIGHT: a little over 1 in 8 by the draw, which the squares
 * that are forced bring down to it), and a square is never far: after NO_SQUARE pieces in a row without one, the next
 * everyday piece is a square.
 */
const EVERYDAY = { cubo: 0, ladrillo: 2, triangulo: 5 }, WEIGHT = { cubo: 4, ladrillo: 3, triangulo: 1.15 }, NO_SQUARE = 3;
const SPECIAL = ['ele', 'bola', 'te', 'domo', 'hexagono', 'zeta', 'cruz'], SPECIAL_AT = [8, 12, 17, 22, 27, 32, 37], EVERY = 5;
function specialAt(i) {
  const n = i + 1, k = SPECIAL_AT.indexOf(n), last = SPECIAL_AT[SPECIAL_AT.length - 1];
  if (k >= 0) return { kind: SPECIAL[k], debut: true };
  if (n > last && (n - last) % EVERY === 0) return { kind: SPECIAL[((n - last) / EVERY - 1) % SPECIAL.length], debut: false };
  return null;
}

/**
 * The i-th piece, the same for everyone with the seed: a special one on its turn, the new everyday kind on the piece
 * it starts, a square if there has been none for a while, else drawn from the everyday ones seen so far.
 * Pieces are asked for in order: `S.noSq` counts the ones since the last square.
 */
function pieceAt(S, i) {
  const sp = specialAt(i);
  let spec;
  if (sp) spec = { kind: sp.kind, k: 0.9 + 0.2 * S.rngSeq(), flip: S.rngSeq() < 0.5, debut: sp.debut };
  else {
    const pool = Object.keys(EVERYDAY).filter(k => EVERYDAY[k] <= i), newest = pool[pool.length - 1], debut = EVERYDAY[newest] === i;
    let kind = newest;
    if (!debut) {
      if (S.noSq >= NO_SQUARE) kind = 'cubo';
      else {
        let x = S.rngSeq() * pool.reduce((s, k) => s + WEIGHT[k], 0);
        for (const k of pool) { x -= WEIGHT[k]; if (x < 0) { kind = k; break; } }
      }
    }
    spec = { kind, k: i < 4 ? 1 : 0.9 + 0.25 * S.rngSeq(), flip: false, debut: debut && i > 0 };
  }
  S.noSq = spec.kind === 'cubo' ? 0 : S.noSq + 1;
  return spec;
}

/** How hard the n-th piece is (n from 0): everything tightens a little with every piece. */
function params(n) {
  const u = Math.min(1, n / 60);
  return {
    hold: Math.max(2, 5 - 0.06 * n),                          // seconds to place the piece before it falls by itself: fewer each time
    gap: Math.max(0.3, 0.6 - 0.006 * n),                      // the wait for the next piece
    K: 28 - 12 * u, D: 5,                                     // the disc's spring: softer, so it leans more
    turned: n < 3 ? 0 : n < 12 ? 1 : 2,                       // how the piece comes: straight, turned about the vertical, or (half the time) turned any way
  };
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** `skip` (lab only): starts as hard as if that many pieces were already down, on an empty disc. */
function newGame(seed, skip = 0) {
  const pl = { id: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, ox: 0, oy: 0, oz: 0, ux: 0, uy: 1, uz: 0, qw: 1, qx: 0, qy: 0, qz: 0, r: IDENT.slice(),
    invM: 0, inertia: PLAT_I, ii: [1 / PLAT_I, 0, 1 / PLAT_I, 0, 0, 0], parts: [], cells: [], looks: [], load: [0, 0, 0], mass: 0, touch: false };
  pl.disc = mkPart(pl, 1, DISC, 0, -TH / 2, 0, IDENT, { fr: 0.4, base: true });
  pl.parts.push(pl.disc);
  // The wall: 24 boxes around the edge, a third of a cube tall: nothing slides out under it or through it; a piece only leaves over its top
  for (let i = 0; i < 24; i++) {
    const [c, s] = RING[2 * i + 1], d = RAD * C75 - RIM_W / 2;
    pl.parts.push(mkPart(pl, 2 + i, RIM_BOX, c * d, RIM / 2, s * d, [-s, 0, -c, 0, 1, 0, c, 0, -s], { fr: 0.3, base: true, wall: i }));
  }
  const S = { seed, skip, rngSeq: mulberry(seed), rngCar: mulberry(seed ^ 0x9e3779b9), t: 0, ids: 100, phase: 'play', P: params(skip),
    lives: 3, score: 0, landed: 0, perfects: 0, bonus: 0, streak: 0, best: 0, done: false, overAt: 0,
    plat: pl, bodies: [], prev: new Map(), K: 0, D: 5, smax: 0.5, top: 0, peak: 0, hover: CLEAR,
    queue: [], gen: skip, held: null, released: 0, noSq: 0, spawnT: 0.7, tip: 0, warnAt: -9, capsized: false, capAt: 0, ev: [] };
  S.K = S.P.K;
  while (S.queue.length < 3) S.queue.push(pieceAt(S, S.gen++));
  return S;
}
/** The next piece comes to the hand, over a spot and turned in a way drawn with the seed. */
function takeNext(S) {
  const P = S.P, spec = S.queue.shift(), r = S.rngCar;
  while (S.queue.length < 3) S.queue.push(pieceAt(S, S.gen++));
  const h = S.held = { spec, form: formFor(spec), qw: 1, qx: 0, qy: 0, qz: 0, x: (r() * 2 - 1) * 0.45, z: (r() * 2 - 1) * 0.45, fuse: P.hold, hold: P.hold };
  const a = r() * 2 - 1, b = r() * 2 - 1, c = r() * 2 - 1, d = r() * 2 - 1, any = r() < 0.5;
  if (P.turned === 2 && any && a * a + b * b + c * c + d * d > 0.05) { const l = 1 / Math.sqrt(a * a + b * b + c * c + d * d); h.qw = a * l; h.qx = b * l; h.qy = c * l; h.qz = d * l; }
  else if (P.turned && a * a + c * c > 0.02) { const l = 1 / Math.sqrt(a * a + c * c); h.qw = a * l; h.qy = c * l; }
  if (spec.debut) S.ev.push({ type: 'debut', kind: spec.kind });
}
function release(S, auto) {
  const h = S.held, b = mkBody(++S.ids, h.form, h.x, S.hover, h.z);
  b.qw = h.qw; b.qx = h.qx; b.qy = h.qy; b.qz = h.qz; b.kind = h.spec.kind; b.tc = null; b.judged = false; b.auto = auto; place(b);
  S.bodies.push(b); S.held = null; S.released++; S.spawnT = S.P.gap;
  S.ev.push({ type: 'drop', auto });
  // The next piece is a little harder
  S.P = params(S.released + S.skip); S.K = S.P.K;
}
/** A buried piece stops being a body and becomes parts of the disc, where it is: the disc takes its weight and gets harder to turn. */
function weld(S, b) {
  const pl = S.plat, P = pl.r;
  const fix = (q, o) => {
    const dx = q.x - pl.x, dy = q.y - pl.y, dz = q.z - pl.z, lr = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) lr[3 * i + j] = P[i] * q.r[j] + P[3 + i] * q.r[3 + j] + P[6 + i] * q.r[6 + j];
    return mkPart(pl, q.id, q.shape, P[0] * dx + P[3] * dy + P[6] * dz, P[1] * dx + P[4] * dy + P[7] * dz, P[2] * dx + P[5] * dy + P[8] * dz, lr, o);
  };
  const parts = b.parts.map(q => fix(q, { fr: b.fr, re: b.re, kind: b.kind })), cells = b.cells.map(q => fix(q, { kind: b.kind, hide: q.hide, seams: q.seams }));
  pl.parts.push(...parts); pl.cells.push(...cells); pl.looks.push(...(cells.length ? cells : parts));
  // Its weight, at its centre of mass
  const dx = b.x - pl.x, dy = b.y - pl.y, dz = b.z - pl.z, lx = P[0] * dx + P[3] * dy + P[6] * dz, ly = P[1] * dx + P[4] * dy + P[7] * dz, lz = P[2] * dx + P[5] * dy + P[8] * dz;
  pl.load[0] += b.m * lx; pl.load[1] += b.m * ly; pl.load[2] += b.m * lz; pl.mass += b.m;
  pl.inertia += b.m * (lx * lx + ly * ly + lz * lz) + 3 / (b.ib[0] + b.ib[1] + b.ib[2]); pl.ii[0] = pl.ii[2] = 1 / pl.inertia;
  S.bodies = S.bodies.filter(x => x !== b);
}

/**
 * One fixed step of the game. `inp`: what the player does this step, or null: { x, z } where the piece
 * in hand is held over, `q` (optional, [w, x, y, z]) how they have turned it, and `drop` to let it go.
 */
function advance(S, inp) {
  S.t += DT;
  const pl = S.plat;
  if (S.phase === 'play') {
    if (S.held) {
      const h = S.held;
      if (inp) {
        let x = inp.x, z = inp.z; const d2 = x * x + z * z;
        if (d2 > REACH * REACH) { const l = REACH / Math.sqrt(d2); x *= l; z *= l; }
        h.x = x; h.z = z;
        if (inp.q) { const [w, a, b, c] = inp.q, l2 = w * w + a * a + b * b + c * c; if (l2 > 1e-6) { const l = 1 / Math.sqrt(l2); h.qw = w * l; h.qx = a * l; h.qy = b * l; h.qz = c * l; } }
      }
      h.fuse -= DT;
      if ((inp && inp.drop) || h.fuse <= 0) release(S, !(inp && inp.drop));
    } else { S.spawnT -= DT; if (S.spawnT <= 0) takeNext(S); }
  }
  for (const b of S.bodies) if (b.tc == null && b.vy < -FALL_V) b.vy = -FALL_V;
  if (S.capsized) {
    // Gone over: nothing holds the disc any more. It keeps tipping the way it leaned and, a moment later, drops off its point with whatever is welded to it
    const l = Math.sqrt(pl.ux * pl.ux + pl.uz * pl.uz) || 1;
    if (pl.uy > -0.2) { pl.ox += TIP_A * pl.uz / l * DT; pl.oz -= TIP_A * pl.ux / l * DT; } else { pl.ox = 0; pl.oz = 0; }
    if (S.t > S.capAt + 0.3) { pl.vy -= GRAV * DT; pl.y += pl.vy * DT; }
  }
  stepWorld(S);
  if (S.phase === 'play') {
    const lean2 = pl.ux * pl.ux + pl.uz * pl.uz;
    S.tip = lean2 >= TIP * TIP ? S.tip + DT : Math.max(0, S.tip - 2 * DT);
    if (S.tip > TIP_S) {
      S.capsized = true; S.capAt = S.t; S.phase = 'over'; S.held = null; S.overAt = S.t + 2.4; S.K = 0; S.D = 0; S.smax = 2;
      S.ev.push({ type: 'capsize' });
    } else if (lean2 >= WARN * WARN && S.t - S.warnAt > 2.5) { S.warnAt = S.t; S.ev.push({ type: 'warn' }); }
  }

  // The top of the pile: of what is welded and of what has stayed
  let top = 0, loose = 0, low = null;
  for (const q of pl.parts) if (!q.base && q.maxy > top) top = q.maxy;
  for (const b of S.bodies.slice()) {
    if (b.tc == null && b.touch) { b.tc = S.t; S.ev.push({ type: 'hit', x: b.x, y: b.miny, z: b.z, m: b.m, kind: b.kind, v: Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz) }); }
    if (b.y < FALL_Y && !b.lost) {
      // A piece off the disc costs a life, and the perfect streak; the third ends the game
      b.lost = true;
      const counts = S.phase === 'play';
      if (counts) { S.lives--; S.streak = 0; if (S.lives <= 0) { S.phase = 'over'; S.held = null; S.overAt = S.t + 1.8; } }
      S.ev.push({ type: 'fall', x: b.x, y: b.y, z: b.z, kind: b.kind, counts, lives: S.lives, over: counts && S.lives <= 0 });
    }
    if (b.y < -7) { S.bodies = S.bodies.filter(x => x !== b); continue; }
    if (b.lost) continue;
    if (S.phase === 'play' && b.tc != null && !b.judged && S.t - b.tc >= JUDGE_S) {
      // It stayed: a point, and a perfect one if the disc is level and still. One that fell by itself (the time ran out) counts the same: it just fell where it was
      b.judged = true; S.landed++; S.score++;
      const perfect = pl.ux * pl.ux + pl.uz * pl.uz < PERFECT * PERFECT && pl.ox * pl.ox + pl.oz * pl.oz < 0.01;
      let bonus = 0;
      if (perfect) { S.streak++; S.perfects++; if (S.streak > S.best) S.best = S.streak; bonus = Math.min(S.streak, 5); S.score += bonus; S.bonus += bonus; } else S.streak = 0;
      S.ev.push({ type: 'score', x: b.x, y: b.maxy, z: b.z, perfect, streak: S.streak, bonus });
    }
    if (b.judged) {
      if (b.maxy > top) top = b.maxy;
      loose++;
      // The lowest one at rest is the next to be welded
      if (b.touch && b.vx * b.vx + b.vy * b.vy + b.vz * b.vz < 0.02 && b.ox * b.ox + b.oy * b.oy + b.oz * b.oz < 0.1 && (!low || b.y < low.y)) low = b;
    }
  }
  S.top = top;
  if (top > S.peak) S.peak = top;
  if (S.phase === 'play' && loose > LOOSE && low) weld(S, low);
  // The hand rides above the pile, so a piece always falls about as far
  S.hover += (top + CLEAR - S.hover) * 2.5 * DT;
  if (S.phase === 'over' && S.t >= S.overAt) S.done = true;
}
