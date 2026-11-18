// Blackjack (lab): plays a solo game against the house to the result, then conformance checks run it in
// every language (tools/e2e/conformance.mjs).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
import { doubleTap } from '../double-tap.mjs';

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
    // the felt is cleared first (CLEAR_MS): wait for the next bets or the result
    await b.until("document.getElementById('btn-bet') || document.querySelector('#screen-result.active')", 4000);
  }
}

ok(await b.active() === 'screen-result', 'it reaches the result');
ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), 'the result goes back to the lab (C-19)');
ok(await b.evaluate("!!document.getElementById('btn-change-mode') && !!document.querySelector('#result-rank > *') && !!document.querySelector('.rk-contar-solo')"), 'the result has the standard blocks: change mode, «¿Quieres que esta partida cuente?» and the game\'s ranking (C-19)');
await b.shot('result');

// Signed in, on the felt trial (on by default on localhost), the setup carries the account's name (D-212)
await b.go(SITE + '/labs/blackjack/'); await b.evaluate("localStorage.clear(); localStorage.setItem('juegos-de-salon:jugador', JSON.stringify({ jid: 'abcd1234', n: 'Luz' })); 1");
await b.go(SITE + '/labs/blackjack/'); await b.evaluate("document.querySelector('.mode[data-mode=\"cpu\"]').click(); 1"); await sleep(300);
ok(await b.evaluate("document.querySelector('#setup-form input').value") === 'Luz', 'signed in, the setup has the account name');
ok(await b.evaluate("document.querySelector('#setup-form .signed-name')?.textContent === 'Luz' && document.querySelector('#setup-form input').hidden"), 'the name shows as a block, not an input');
await b.shot('signed');
await b.evaluate("document.querySelector('#setup-form .name-change').click(); 1");
ok(await b.evaluate("!document.querySelector('#setup-form input').hidden && !document.querySelector('#setup-form .signed-name')"), '«Cambiar» opens the input to type another name');

// The felt table (flag blackjack-felt): on by default on localhost (a 'lab' flag with the door open), off from the tester tab's switch
const firstHand = async () => {
  await b.go(SITE + '/labs/blackjack/'); await sleep(600);
  await b.evaluate("document.querySelector('.mode[data-mode=\"cpu\"]').click(); 1"); await sleep(300);
  await b.evaluate("const i = document.querySelector('#setup-form input'); i.value = 'Ana'; i.dispatchEvent(new Event('input', { bubbles: true })); 1");
  await b.evaluate("document.getElementById('btn-start').click(); 1"); await sleep(300);
  await b.evaluate("document.getElementById('btn-bet').click(); 1");
  await b.until("document.getElementById('btn-stand') || document.getElementById('btn-next-round')", 12000); await sleep(300);
  return b.evaluate("document.documentElement.classList.contains('bj-felt') && !!document.querySelector('#seats-box .bet-spot') && !!document.querySelector('#shoe-chip .shoe-bar')");
};
await b.evaluate('localStorage.clear(); 1');
await b.go(SITE + '/labs/blackjack/'); await sleep(600);
await b.evaluate("document.querySelector('.mode[data-mode=\"cpu\"]').click(); 1"); await sleep(300);
await b.evaluate("const i = document.querySelector('#setup-form input'); i.value = 'Ana'; i.dispatchEvent(new Event('input', { bubbles: true })); document.getElementById('btn-start').click(); 1"); await sleep(400);
ok(await b.evaluate("(document.querySelector('#action-box .bet-hint')?.textContent || '').includes('↓')"), 'on the felt, the first step sits right above the chips');
ok(await firstHand(), 'the felt table: the bet is a chip on its spot and the shoe a bar');
ok(await b.evaluate("!!document.querySelector('.bj-seat-coins .seg-chip') && !document.querySelector('#screen-play').textContent.includes('🪙')"), 'on the felt, every coin is the table chip, no 🪙');
await b.shot('felt');
await b.evaluate("localStorage.clear(); localStorage.setItem('juegos-de-salon:flags-off', JSON.stringify({ 'blackjack-felt': true })); 1");
ok(!(await firstHand()) && !(await b.evaluate("!!document.querySelector('.bet-spot')")), 'switched off in the tester tab, the table is as before');
ok(await b.evaluate("!document.querySelector('#screen-play .seg-chip') && document.querySelector('.bj-seat-coins').textContent.includes('🪙')"), 'switched off, the coins keep the 🪙 text');
// A double tap on a button that waits on an animation counts once (C-14, D-576): «Apostar» deals one hand,
// «Siguiente ronda» (which fades the felt off first) moves one round, and the table is never left without cards
await b.evaluate("localStorage.clear(); 1");
await b.go(SITE + '/labs/blackjack/'); await sleep(600);
await b.evaluate("document.querySelector('.mode[data-mode=\"cpu\"]').click(); 1"); await sleep(300);
await b.evaluate("const i = document.querySelector('#setup-form input'); i.value = 'Ana'; i.dispatchEvent(new Event('input', { bubbles: true })); 1");
await b.evaluate("document.getElementById('btn-start').click(); 1"); await sleep(300);
const round = () => b.evaluate("document.getElementById('round-chip').textContent");
const r1 = await round();
await doubleTap(b, '#btn-bet');
await b.until("document.getElementById('btn-stand') || document.getElementById('btn-next-round')", 12000); await sleep(300);
ok(await b.evaluate("document.querySelectorAll('#seats-box .bj-hand .pcard').length === 2 && document.querySelectorAll('#dealer-box .pcard').length === 2"), 'a double tap on «Apostar» deals one hand: two cards each');
if (await b.evaluate("!!document.getElementById('btn-stand')")) {
  await b.evaluate("document.getElementById('btn-stand').click(); 1");
  await b.until("document.getElementById('btn-next-round') || document.querySelector('#screen-result.active')", 14000);
}
await doubleTap(b, '#btn-next-round');
await b.until("document.getElementById('btn-bet')", 6000); await sleep(800);
const r2 = await round();
ok(r1.replace(/\d+/, n => +n + 1) === r2 && await b.evaluate("!!document.getElementById('btn-bet') && !document.querySelector('.bj-table.clearing')"), `a double tap on «Siguiente ronda» moves one round (${r1} → ${r2}) and leaves the bets open`);
ok(await b.evaluate("(document.querySelector('#action-box .bet-hint')?.textContent || '').includes('↓')"), 'the next round shows the bet hint again');

ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
