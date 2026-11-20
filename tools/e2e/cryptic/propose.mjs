// Cryptic (lab): «Propón tu críptico» and «Hoy es tu críptico» (the owner, 2026-11-19). At the end of a
// clue the call to action opens the feedback form with the kind «Críptico» picked and the registered
// player's name in it; it asks for the clue and the answer, and sends (with `?test`, to the phone) the
// proposal with its kind and whom to credit. Then today's clue signed as this player's: the author
// does not play it, sees it solved, the day counts, and practice never gives it to them.
// Usage: SITE=http://localhost:8765 node tools/e2e/cryptic/propose.mjs /tmp/cryptic-propose
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT, width: 320, height: 700 });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };
const URL_ = SITE + '/labs/cryptic/?test';
const ME = { jid: 'abcd1234', n: 'Ana' };

await b.go(URL_); await b.evaluate(`localStorage.clear(); localStorage.setItem('juegos-de-salon:jugador', '${JSON.stringify(ME)}'); 1`); await b.go(URL_);

// A clue to the end: giving up is the shortest way
await b.evaluate("document.querySelector('#btn-play').click(); 1"); await sleep(300);
await b.evaluate("document.getElementById('btn-give-up').click(); document.getElementById('btn-give-up').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-result', 'the clue reaches its result');
ok(await b.evaluate("!!document.querySelector('#result-propose #btn-propose')"), 'the result invites to propose a clue');

// The form: the kind already picked, the player's name, the clue and the answer required
await b.evaluate("document.getElementById('btn-propose').click(); 1"); await sleep(600);
ok(await b.evaluate("!!document.querySelector('.labs-capa #propose-clue')"), 'the form opens over the page');
ok(await b.evaluate("document.querySelector('.labs-capa .buzon-tipo[aria-pressed=\"true\"]')?.dataset.tipo") === 'criptico', 'with the kind «Críptico» already picked');
ok(await b.evaluate("document.getElementById('propose-name').value") === ME.n, "with the registered player's name, which can be changed");
await b.evaluate("document.getElementById('propose-clue').value = 'Una monja alborotada termina en el sándwich'; document.getElementById('btn-propose-send').click(); 1"); await sleep(300);
ok(await b.evaluate("!!document.querySelector('.labs-capa .labs-error').textContent && !document.getElementById('propose-done')"), 'without the answer it asks for it and sends nothing');
await b.evaluate("document.getElementById('propose-answer').value = 'Jamón'; document.getElementById('propose-how').value = 'MONJA revuelta'; 1");
await b.shot('propose-form-320');
ok(await b.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'nothing overflows at 320 px');
await b.evaluate("document.getElementById('btn-propose-send').click(); 1"); await sleep(600);
ok(await b.evaluate("!!document.getElementById('propose-done')"), 'sending says thanks');
const sent = JSON.parse(await b.evaluate("localStorage.getItem('juegos-de-salon:buzon:prueba') || '[]'"));
const p = sent.at(-1) || {};
const ctx = JSON.parse(p.contexto || '{}');
ok(p.tipo === 'criptico' && /Pista: Una monja/.test(p.texto) && /Respuesta: Jamón/.test(p.texto) && /Cómo se llega: MONJA/.test(p.texto), 'the message carries the kind, the clue, the answer and how');
ok(ctx.juego === 'cryptic' && ctx.autor === ME.n && ctx.j === ME.jid, 'and whom to credit: the name and the player');
await b.evaluate("document.querySelector('.labs-capa .btn--yellow').click(); 1"); await sleep(300);
ok(await b.evaluate("!document.querySelector('.labs-capa')"), 'the form closes');

// «Hoy es tu críptico»: today's clue signed by this player
await b.go(URL_); await b.evaluate(`localStorage.removeItem('juegos-de-salon:cryptic:days'); 1`); await b.go(URL_);
await b.evaluate(`window.__cryptic.sign(window.__cryptic.today(), { n: 'Ana', j: '${ME.jid}' }); 1`); await sleep(200);
ok(/tu pista/.test(await b.evaluate("document.getElementById('today-note').textContent")), 'the cover says today everyone plays their clue');
await b.evaluate("document.querySelector('#btn-play').click(); 1"); await sleep(400);
ok(await b.active() === 'screen-result', 'the author does not play it: straight to its solution');
ok(/tu críptico/i.test(await b.evaluate("document.getElementById('result-title').textContent")), 'titled «Hoy es tu críptico»');
ok(await b.evaluate("document.getElementById('result-credit').hidden"), 'no «Críptico de…» for its own author');
ok(await b.evaluate(`JSON.parse(localStorage.getItem('juegos-de-salon:cryptic:days'))[window.__cryptic.state().date]?.solved === true`), 'the day counts for the streak');
ok(await b.evaluate("!document.getElementById('btn-share')"), 'nothing to share');
await b.shot('your-day-320');
for (let k = 0; k < 6; k++) {
  await b.evaluate("document.getElementById('btn-practice').click(); 1"); await sleep(200);
  if (await b.evaluate('window.__cryptic.state().index === window.__cryptic.today()')) { ok(false, 'practice gave the player their own clue'); break; }
  await b.evaluate("document.getElementById('btn-give-up').click(); document.getElementById('btn-give-up').click(); 1"); await sleep(200);
}
ok(true, 'practice never gives the player their own clue');

// Another player sees whose clue it is
await b.go(URL_); await b.evaluate(`localStorage.clear(); 1`); await b.go(URL_);
await b.evaluate(`window.__cryptic.sign(window.__cryptic.today(), { n: 'Ana', j: '${ME.jid}' }); 1`);
await b.evaluate("document.querySelector('#btn-play').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-play', 'everyone else plays it');
await b.evaluate("document.getElementById('btn-give-up').click(); document.getElementById('btn-give-up').click(); 1"); await sleep(300);
ok(await b.evaluate("document.getElementById('result-credit').textContent") === 'Críptico de Ana', 'and sees «Críptico de Ana» with the solution');

ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors.join(' | ') : ''));
await b.close?.();
console.log(failures ? `✗ ${failures} failed` : 'cryptic propose: all good');
process.exit(failures ? 1 : 0);
