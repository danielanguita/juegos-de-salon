// The Dominorama splash clip (prepared with the game's way out of the lab; no campaign names it yet): the real
// game at /dominorama/ (?seed=SPLASH, its window.__dominorama hook) plays the medium board the way a player
// does: a tap turns a domino in the tray until it faces the right way, a tap on a cell lays it, each zone's
// diamond rings green as it fills, and the board glows when it is solved. One screenshot per frame, through
// the e2e browser (tools/e2e/cdp.mjs, no Playwright), with the page's flag held on for this browser only.
//
//   python3 -m http.server 8791 -d public &
//   SITE=http://localhost:8791 node marketing/splash/dominorama-clip.mjs /tmp/dominorama-frames
//   ffmpeg -framerate 30 -i /tmp/dominorama-frames/f%04d.png -vf "scale=480:-2,format=yuv420p" \
//     -c:v libx264 -crf 26 -preset slow -movflags +faststart -an public/assets/splash/dominorama.mp4
//
// The frame is the board and the tray, with the page's own ground; the poster (dominorama-start.jpg) is the
// first frame and the still (dominorama.jpg) the last.
import { mkdirSync, writeFileSync } from 'node:fs';
import { launch, sleep } from '../../tools/e2e/cdp.mjs';

const OUT = process.argv[2] || '/tmp/dominorama-frames';
const SITE = process.env.SITE || 'http://localhost:8791';
mkdirSync(OUT, { recursive: true });
const b = await launch({ dir: `${OUT}/profile`, out: OUT, width: 390, height: 844 });
const ev = e => b.evaluate(e);
await b.flags({ dominorama: 'all' });
await b.go(`${SITE}/dominorama/?test&lang=es&seed=SPLASH`, 1500);
await ev(`document.getElementById('btn-empezar').click(); 1`);
for (let t = 0; t < 100 && !(await ev(`!!document.getElementById('dm-tablero') && !document.getElementById('cuenta')`)); t++) await sleep(100);
// The medium board: the easy one is solved off camera
await ev(`window.__dominorama.solveBoard(); 1`);
for (let t = 0; t < 60 && !(await ev(`/Tablero 2 de 3/.test(document.getElementById("dm-marcador")?.textContent || "") && !document.querySelector("#dm-tablero.resuelto")`)); t++) await sleep(100);
await sleep(400);
await ev(`(() => { const s = document.createElement('style'); s.textContent = '.sparkles, .sparkle, #cover, .topbar, .jugar-head .reloj, #tr-tab, #tr-panel { visibility: hidden !important; }'; document.head.append(s); document.getElementById('dm-tablero').scrollIntoView({ block: 'start' }); })(); 1`);
await sleep(300);
const clip = await ev(`(() => { const a = document.getElementById('dm-tablero').getBoundingClientRect(), z = document.getElementById('dm-bandeja').getBoundingClientRect(); const pad = 12; return { x: 0, y: Math.max(0, a.top + scrollY - pad), width: innerWidth, height: z.bottom - a.top + 2 * pad, scale: 1 }; })()`);

let n = 0;
const shot = async () => {
  const r = await b.send('Page.captureScreenshot', { format: "png", clip, captureBeyondViewport: true });
  writeFileSync(`${OUT}/f${String(n++).padStart(4, '0')}.png`, Buffer.from(r.result.data, 'base64'));
};
const hold = async k => { for (let i = 0; i < k; i++) await shot(); };
await hold(24);
const steps = await ev(`(() => { const t = window.__dominorama.board(); return t.solucion.map(s => {
  const a = t.celdas[s.a], c = t.celdas[s.b], vertical = a.c === c.c;
  const first = vertical ? (a.r < c.r ? 0 : 1) : (a.c < c.c ? 0 : 1);
  return { f: s.f, giro: (vertical ? 1 : 0) + (first ? 2 : 0), cell: first ? s.b : s.a };
}); })()`);
for (const s of steps) {
  // a tap turns it a quarter: from 0, four taps come back to 0
  const taps = s.giro || 4;
  for (let k = 0; k < taps; k++) {
    await ev(`document.querySelector('#dm-bandeja .dm-ficha[data-f="${s.f}"]').click(); 1`);
    await hold(5);
  }
  await hold(4);
  await ev(`document.querySelector('#dm-tablero .dm-celda[data-i="${s.cell}"]').click(); 1`);
  await hold(14);
}
for (let k = 0; k < 24 && await ev(`!!document.querySelector("#dm-tablero.resuelto") && /Tablero 2/.test(document.getElementById("dm-marcador").textContent)`); k++) await shot();
// the last frame may already show the next board (it comes 1.3 s after the glow): drop it
n--;
console.log(n, "frames");
b.close();
