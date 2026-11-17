// The Wobbles (lab): the owner's prototype kept whole (docs/games/wobbles.md). Opens it, starts a round from its
// cover card, checks the game runs and ends on its own game-over card, with no console errors.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };

for (const lang of ['es', 'en', 'pt']) {
  await b.go(SITE + '/labs/wobbles/?seed=7&lang=' + lang); await sleep(600);
  ok(await b.evaluate("!!window.__balanza && !document.getElementById('card').hidden"), lang + ': the cover card shows');
  await b.evaluate("document.getElementById('cBtn').click(); 1"); await sleep(600);
  ok(await b.evaluate("window.__balanza.state === 'play' && document.getElementById('card').hidden"), lang + ': a round starts');
  await b.evaluate('window.__balanza.finish(); 1'); await sleep(300);
  ok(await b.evaluate("window.__balanza.state === 'over' && !document.getElementById('card').hidden"), lang + ': it ends on its game-over card');
  if (lang === 'es') await b.shot('over');
}
ok(await b.evaluate("!!document.querySelector('#hud a[href=\"../\"], a[href=\"../\"]')"), 'the ‹ goes back to the lab');
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
