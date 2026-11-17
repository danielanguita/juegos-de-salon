// Blackjack (lab): plays a solo game against the house to the result, then conformance checks run it in
// every language (tools/e2e/conformance.mjs).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };

await b.go(SITE + '/labs/blackjack/'); await b.evaluate('localStorage.clear(); 1'); await b.go(SITE + '/labs/blackjack/');
await b.evaluate("document.querySelector('.mode[data-mode=\"cpu\"]').click(); 1"); await sleep(300);
await b.evaluate("const i = document.querySelector('#setup-form input'); i.value = 'Ana'; i.dispatchEvent(new Event('input', { bubbles: true })); 1");
await b.evaluate("document.getElementById('btn-start').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-play', 'the game starts');

for (let step = 0; step < 6 && await b.active() === 'screen-play'; step++) {
  if (await b.evaluate("!!document.getElementById('btn-bet')")) {
    await b.evaluate("document.getElementById('btn-bet').click(); 1");
    await b.until("document.getElementById('btn-stand') || document.getElementById('btn-next-round') || document.querySelector('#screen-result.active')", 12000);
  }
  if (await b.evaluate("!!document.getElementById('btn-stand')")) {
    await b.evaluate("document.getElementById('btn-stand').click(); 1");
    await b.until("document.getElementById('btn-next-round') || document.querySelector('#screen-result.active')", 14000);
  }
  if (await b.evaluate("!!document.getElementById('btn-next-round')")) {
    await b.evaluate("document.getElementById('btn-next-round').click(); 1");
    await sleep(300);
  }
}

ok(await b.active() === 'screen-result', 'it reaches the result');
ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), 'the result goes back to the lab (C-19)');
await b.shot('result');
ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
