// Cryptic (lab): plays today's clue to the result (a wrong guess, a hint, the answer), then a
// practice clue given up; the conformance checks run it in every language (tools/e2e/conformance.mjs).
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';

const SITE = process.env.SITE || 'http://localhost:8765';
const OUT = output();
const b = await launch({ port: 0, dir: OUT + '/p', out: OUT });
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '✓ ' : '✗ ') + msg); if (!cond) failures++; };
const type = async text => {
  await b.evaluate(`(() => { const i = document.getElementById('answer'); i.value = ${JSON.stringify(text)}; i.dispatchEvent(new Event('input')); document.getElementById('btn-check').click(); })(); 1`);
  await sleep(250);
};

await b.go(SITE + '/labs/cryptic/'); await b.evaluate('localStorage.clear(); 1'); await b.go(SITE + '/labs/cryptic/');
await b.shot('cover');
await b.evaluate("document.querySelector('#btn-play').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-play', "today's clue opens");
ok(/\(\d+(,\d+)*\)$/.test(await b.evaluate("document.getElementById('clue').textContent")), 'the clue ends with its length');
const answer = await b.evaluate('window.__cryptic.answer()');
const n = answer.normalize('NFD').replace(/[̀-ͯ]/g, '').length;
ok(await b.evaluate("document.querySelectorAll('#tiles .tile').length") === n, 'one box per letter');

await type('X'.repeat(n + 1));
ok(await b.evaluate("document.getElementById('feedback').classList.contains('notice--warn')"), 'a guess of another length is a warning, not counted');
await type('Z'.repeat(n));
ok(await b.evaluate("document.getElementById('feedback').classList.contains('notice--bad')"), 'a wrong guess says so');
ok(await b.evaluate('window.__cryptic.state().guesses.length') === 1, 'only the guess of the right length counts');
await b.evaluate("document.getElementById('btn-hint').click(); 1"); await sleep(150);
await b.evaluate("document.getElementById('btn-hint').click(); 1"); await sleep(150);
ok(await b.evaluate("!!document.querySelector('#clue u.def')"), 'the second hint underlines the definition');
await b.shot('play');

// Resume (C-6): a reload in the middle comes back to the same clue with its hints
await b.go(SITE + '/labs/cryptic/');
await b.evaluate("document.querySelector('#btn-play').click(); 1"); await sleep(300);
ok(await b.evaluate('window.__cryptic.state().hints') === 2, "today's clue resumes with its hints");

await type(answer.toLowerCase());
ok(await b.active() === 'screen-result', 'the answer reaches the result');
ok(await b.evaluate("document.getElementById('result-stars').textContent") === '⭐', 'three stars minus two hints');
ok(/1/.test(await b.evaluate("document.getElementById('result-line').textContent")), 'the streak starts');
ok(await b.evaluate("!!document.querySelector('#fin-salidas a[href$=\"labs/\"]')"), 'the result goes back to the lab (C-19)');
await b.shot('result');

// Today is done: the cover says so, and the clue opens on its result
await b.go(SITE + '/labs/cryptic/');
ok(/⭐/.test(await b.evaluate("document.getElementById('today-note').textContent")), "the cover shows today's stars");

// Practice: a clue from another day, given up
await b.evaluate("document.querySelector('#btn-practice-cover').click(); 1"); await sleep(300);
ok(await b.evaluate('window.__cryptic.state().practice') === true, 'practice opens another clue');
await b.evaluate("document.getElementById('btn-give-up').click(); 1"); await sleep(300);
ok(await b.active() === 'screen-result', 'giving up reaches the result');
ok((await b.evaluate("document.getElementById('result-title').textContent")).includes(await b.evaluate('window.__cryptic.answer()')), 'giving up shows the answer');
ok(await b.evaluate("document.getElementById('btn-practice').className.includes('btn--yellow')"), 'after practice, another practice clue is the main action');

ok(!b.errors.length, 'no console errors' + (b.errors.length ? ': ' + b.errors[0].slice(0, 160) : ''));
b.close();
process.exit(failures ? 1 : 0);
