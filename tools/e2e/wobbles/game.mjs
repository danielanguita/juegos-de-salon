// Tembleque (lab): the cover's lever picks the level and its picture follows; each (the owner's prototype kept whole,
// docs/games/wobbles.md) starts a round from its card and ends on its game-over card, in es/en/pt,
// and its ‹ comes back to the cover.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };

await b.go(SITE + '/labs/wobbles/'); await sleep(600);
ok(await b.evaluate("window.__wobbles.level === 'easy' && document.getElementById('btn-level').getAttribute('aria-checked') === 'false' && !document.getElementById('pic').classList.contains('hard')"), 'the lever starts on easy, with the 2D picture');
await b.shot('cover-easy');
await b.evaluate("document.getElementById('btn-level').click(); 1"); await sleep(700);
ok(await b.evaluate("window.__wobbles.level === 'hard' && document.getElementById('btn-level').getAttribute('aria-checked') === 'true' && document.getElementById('pic').classList.contains('hard') && document.body.classList.contains('wb-hard')"), 'flipping the lever shows hard, the 3D picture and the red cover');
await b.shot('cover-hard');
await b.evaluate("document.getElementById('btn-play').click(); 1"); await sleep(900);
ok(await b.evaluate('location.pathname') === '/labs/wobbles/hard/', '¡A jugar! opens the level the lever shows');

for (const level of ['easy', 'hard']) {
  for (const lang of ['es', 'en', 'pt']) {
    await b.go(SITE + `/labs/wobbles/${level}/?seed=7&spin=0&lang=` + lang); await sleep(600);
    ok(await b.evaluate("!!window.__balanza && !document.getElementById('card').hidden"), `${level} ${lang}: the cover card shows`);
    await b.evaluate("document.getElementById('cBtn').click(); 1"); await sleep(600);
    ok(await b.evaluate("window.__balanza.state === 'play' && document.getElementById('card').hidden"), `${level} ${lang}: a round starts`);
    await b.evaluate('window.__balanza.finish(); 1'); await sleep(300);
    ok(await b.evaluate("window.__balanza.state === 'over' && !document.getElementById('card').hidden"), `${level} ${lang}: it ends on its game-over card`);
    if (lang === 'es') await b.shot(level + '-over');
  }
  ok(await b.evaluate("new URL(document.querySelector('a[href=\"../\"]').href).pathname === '/labs/wobbles/'"), `${level}: its ‹ goes back to the cover`);
}
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
