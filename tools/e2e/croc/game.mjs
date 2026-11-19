// Croc! (lab): starts a seeded run, advances with the overlay controls, and verifies result screen.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };

await b.go(`${SITE}/labs/croc/?seed=4821`);
await b.evaluate('localStorage.clear(); 1');
await b.go(`${SITE}/labs/croc/?seed=4821`);
await b.evaluate("document.querySelector('#btn-play').click(); 1");
await sleep(450);
ok(await b.active() === 'screen-play', 'the game starts');
await b.shot('play');

// Play forward until either win or crash
await b.evaluate(`(() => {
  const g = window.__croc.state();
  // No cars, and the canal still, under one boat as wide as the road: the frog walks across
  if (g) for (const l of g.lanes) {
    if (l.kind === "water") { l.speed = 0; l.vehicles = [{ id: "e2e-boat", type: "boat", len: 99, color: "boatA", x: -40, grazed: false }]; }
    else l.vehicles = [];
  }
})()`);
for (let i = 0; i < 90 && await b.active() === 'screen-play'; i++) {
  await b.evaluate("window.__croc.act('up'); 1");
  await sleep(125);
}
await sleep(800);
ok(await b.active() === 'screen-result', 'it reaches the result');
ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), 'the result goes back to the lab (C-19)');
await b.shot('result');
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
