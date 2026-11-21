// A game's cover animation alone in a page (cup/cover/?game=<id>), the one the home page's game sheet frames
// (lab sub-flag home-carousels-sheet): every game of La Copa that the home page offers draws its cover demo or, without
// one, its "how to play" drawing, as wide as the frame and no wider, grown to fill a taller frame and never past it; a
// game with neither, or no game, draws nothing. In the three languages for one of each kind.
// Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { SUELTOS } from '../../../public/assets/js/games.js';
const OUT = output('/tmp/cup-cover');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

const b = await launch({ dir: `${OUT}/p`, out: OUT, width: 350, height: 420 });
const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await b.evaluate(expr)) return true; await sleep(100); } return false; };
const state = () => b.evaluate(`(() => { const d = document.getElementById('demo'); return { kind: d.dataset.kind || null, h: Math.round(d.getBoundingClientRect().height), kids: d.children.length, wide: document.documentElement.scrollWidth > innerWidth, bar: !!document.querySelector('.topbar, .btn, footer'), link: [...d.querySelectorAll('a')].some(a => a.getClientRects().length > 0), right: Math.round(Math.max(0, ...[...d.querySelectorAll('*')].map(n => n.getBoundingClientRect().right))) }; })()`);

const games = SUELTOS.filter(g => !g.labs && g.available !== false).map(g => g.id);
const kinds = { cover: [], example: [], none: [] };
for (const id of games) {
  await b.go(`${SITE}/cup/cover/?game=${id}&lang=es`, 600);
  await waitFor(`document.getElementById('demo').children.length > 0`, 4000);
  await sleep(400);
  const s = await state();
  kinds[s.kind || 'none'].push(id);
  if (!s.kind) { ok(s.kids === 0 && s.h === 0, `${id}: no demo, nothing drawn`); continue; }
  ok(s.h >= 60 && !s.wide && s.right <= 351 && !s.bar, `${id}: its ${s.kind} is drawn (${s.h} px), no wider than the frame, nothing else on the page`);
  // The drawing grows into a frame taller than itself (here 420 px), never past it; no credit line with a link
  ok(s.h <= 421 && !s.link, `${id}: it fits the frame's height (${s.h} of 420 px) and shows no link`);
  if (id === 'stick') ok(s.h >= 180, `${id}: in a taller frame its demo grows (${s.h} px, 98 on its own)`);
  await b.shot(`cover-${id}`);
}
console.log(`  cover: ${kinds.cover.join(', ')}\n  example: ${kinds.example.join(', ')}\n  none: ${kinds.none.join(', ')}`);
ok(kinds.cover.length >= 5 && kinds.example.length >= 3, 'both kinds are shown: the cover demos and the examples');

// In English and Portuguese, one of each kind
for (const lang of ['en', 'pt']) for (const id of [kinds.cover[0], kinds.example[0]]) {
  await b.go(`${SITE}/cup/cover/?game=${id}&lang=${lang}`, 600);
  ok(await waitFor(`document.getElementById('demo').children.length > 0 && document.documentElement.lang === '${lang}'`, 4000), `${id} in ${lang}`);
}
// No game, or one that does not exist: an empty page, no error on screen
for (const q of ['', '?game=nope']) {
  await b.go(`${SITE}/cup/cover/${q}`, 1200);
  const s = await state();
  ok(s.kids === 0 && !s.bar, `"${q}": nothing drawn`);
}
b.close();
console.log(failures ? `✗ ${failures} failure(s)` : '✓ cup/cover.mjs');
process.exit(failures ? 1 : 0);
