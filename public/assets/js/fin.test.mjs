// The exits of a result screen (C-19, D-343): read from the source, no browser
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const raiz = new URL('../../', import.meta.url);
const leer = p => readFileSync(new URL(p, raiz), 'utf8');

// The contexts and their exits
const fin = leer('assets/js/fin.js');
assert.match(fin, /hoy: \['hoy'\]/, 'One a Day: back to One a Day (the header goes to the menu)');
assert.match(fin, /podio: \['menu'\]/, 'the podium: back to the menu');
assert.match(fin, /suelto: \['menu'\]/, 'a game on its own: back to the menu');
assert.match(fin, /lab: \['lab'\]/, 'a game from the lab: back to the lab');

// Every exit comes from salidasFin: no game builds its own link back to the menu or the lab (C-19, #1042)
import { readdirSync, statSync } from 'node:fs';
const juegos = [];
const buscar = dir => { for (const n of readdirSync(new URL(dir, raiz))) { const p = `${dir}${n}`; if (statSync(new URL(p, raiz)).isDirectory()) buscar(`${p}/`); else if (n === 'game.js') juegos.push(p); } };
buscar('');
// Julepe and Cuarto Rey stay as they are: lab games not played, likely to be discarded (#1039)
for (const p of juegos.filter(p => !/^labs\/(julep|fourth-king)\//.test(p))) {
  assert.doesNotMatch(leer(p), /el\('a', \{[^}]*href: (?:'(?:\.\.\/)+'|`\$\{RAIZ\}(?:labs\/)?`)\s*\}/, `${p}: a link back to the menu or the lab is built by salidasFin (C-19)`);
}

// The One a Day card carries its exits, and goes under the hero
const ui = leer('assets/js/uno-al-dia-ui.js');
assert.match(ui, /salidasFin\('hoy'/, 'the One a Day card brings its exits');
assert.match(ui, /result-hero/, 'ponerTarjeta puts the card under the hero');

// The group games put the card with no place of their own, and no buttons of theirs in today mode
for (const g of ['hangman', 'battleship', 'liars-dice', 'generala']) {
  const s = leer(`${g}/game.js`);
  const llamadas = s.match(/ponerTarjeta\(terminarHoy\([^\n]*/g) || [];
  assert.ok(llamadas.length, `${g}: puts the One a Day card`);
  for (const l of llamadas) assert.match(l, /\}\)\);/, `${g}: ponerTarjeta takes no place: the card goes under the hero (C-19)`);
  assert.doesNotMatch(s, /S\.hoy[^\n]*\? null : el\('button'/, `${g}: today mode adds no button of its own; the card has them (C-19)`);
}

// La Copa: the board button first on a day's result, the menu under the podium, One a Day's exits from its card
const copa = leer('cup/game.js');
const resCopa = leer('cup/result.js');   // the day's result screen lives here (#860)
const dia = resCopa.slice(resCopa.indexOf('function pantallaResultado('), resCopa.indexOf('function pantallaResultado(') + 4000);
assert.ok(dia.indexOf("id: 'btn-volver'") < dia.indexOf('T.dayTable'), 'a Cup day: back to the board before the day table (C-8, C-19)');
assert.ok(dia.indexOf("id: 'btn-volver'") < dia.indexOf('explicacion('), 'a Cup day: back to the board before the breakdown');
assert.match(copa, /salidasFin\('podio'/, 'the podium offers the way back to the menu');
assert.match(copa, /DUELO \? salidaDuelo : hoy \? null : volverDePractica\(\)/, 'One a Day in La Copa\'s games: the exits are the card\'s; a duel round: only back to the duels');

// What a result says, once (C-19, D-353)
const exp = copa.slice(copa.indexOf('function explicacion('), copa.indexOf('function explicacion(') + 1400);
assert.doesNotMatch(exp, /open:/, 'the score breakdown is always folded');
assert.doesNotMatch(copa, /bdTimeSolo/, 'on its own the breakdown does not repeat the time');
const prac = copa.slice(copa.indexOf('function resultadoPractica('), copa.indexOf('function resultadoPractica(') + 9000);
assert.ok(prac.indexOf('volverDePractica()') < prac.indexOf('explicacion(J'), 'on its own the breakdown goes after the exits');
assert.match(copa, /m\.campeon\?\.length > 1 \? medalla\(T\.medalChamp/, 'the podium names a single champion once');
assert.match(copa, /terminada\(L\(\)\.meta, now\) \? null : el\('button', \{ class: 'btn btn--cyan btn--sm', id: 'btn-imagen'/, 'once over, one share button on the podium');
assert.doesNotMatch(ui, /T\.hoyPuntos/, 'the One a Day card does not repeat the score');
assert.match(ui, /plegada: true/, 'under a result, inviting is folded');
const rk = leer('assets/js/ranking.js');
assert.match(rk, /bloqueJugador\(\{ destacado: true, compacto: true, leyenda: T\.countThis/, '"count this game" is the one-line Sign in card');
assert.match(leer('labs/julep/game.js'), /julepes === 1 \? T\.julepesOne/, 'Julepe says "1 julepe"');

// Today's Uno al día under the result of a game played on its own (lab flag solo-result-today-card, #1597)
const { offersToday, WITH_TODAY } = await import('./fin.js');
const { todayPending, estado, KEY, fechaLocal } = await import('./uno-al-dia.js');
assert.deepEqual([...WITH_TODAY], ['suelto', 'lab'], 'the line goes under the exits of a game played on its own, and only there');
assert.ok(offersToday('suelto', { search: '' }), 'a game played on its own offers it');
assert.ok(offersToday('lab', { search: '?test' }), 'a game played from the lab offers it');
assert.ok(!offersToday('hoy', { search: '' }), 'never in Uno al día itself (its card has its own exits)');
assert.ok(!offersToday('podio', { search: '' }), 'never in La Copa: the podium');
assert.ok(!offersToday('suelto', { search: '?today' }) && !offersToday('suelto', { search: '?test&today' }), 'never with ?today: that game is Uno al día');
assert.ok(!offersToday('suelto', { portada: true, search: '' }), 'never on a cover that borrows the exits');
assert.match(fin, /flag\('solo-result-today-card'\)/, 'behind its lab flag');
assert.match(fin, /import\('\.\/uno-al-dia-ui\.js'\)/, 'Uno al día\'s module loads only when the flag is on');
// Who sees it: whoever has not played today's game
assert.deepEqual(todayPending({ juego: 'reinas', dia: null }, 'es'), { id: 'reinas', emoji: '👑', name: 'Reinas' }, 'not played yet: today\'s game, with its emoji and name');
assert.equal(todayPending({ juego: 'reinas', dia: null }, 'en').name, 'Queens', 'its name in the player\'s language');
assert.equal(todayPending({ juego: 'linea', dia: null }, 'pt').name, 'Linha Relâmpago', 'a game only La Copa has, by its JUEGOS_DIA name');
assert.equal(todayPending({ juego: 'reinas', dia: { j: 'reinas', s: 80 } }, 'es'), null, 'played today: no line');
assert.equal(todayPending({ juego: null, dia: null }, 'es'), null, 'no game today: no line');
const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const st = mem();
const e0 = estado({ storage: st });
assert.ok(e0.juego && todayPending(e0, 'es')?.id === e0.juego, 'a phone that never played: the line names today\'s game');
st.setItem(KEY, JSON.stringify({ dias: { [fechaLocal()]: { j: e0.juego, s: 70, ms: 60000, at: Date.now(), n: 1 } } }));
assert.equal(todayPending(estado({ storage: st }), 'es'), null, 'once today\'s game is on this phone: no line');
// One quiet cyan line, not a second yellow button (C-19); every result of a game on its own gets it (C-21)
const linea = ui.slice(ui.indexOf('export function todayLine('), ui.indexOf('export function todayLine(') + 700);
assert.match(linea, /class: 'uad-fin'/, 'the line is .uad-fin');
assert.doesNotMatch(linea, /btn--yellow|btn--cyan/, 'the line is not a button competing with the main action');
assert.match(linea, /rutaHoy\(p\.id\)/, 'Jugar opens today\'s game');
assert.match(leer('assets/css/base.css'), /\.uad-fin \{[^}]*cyan/, '.uad-fin is drawn in cyan');
for (const p of juegos) for (const m of leer(p).matchAll(/salidasFin\('(?:suelto|lab)'[^)]*\)/g)) assert.doesNotMatch(m[0], /portada/, `${p}: a result's exits carry the line; only a cover passes portada`);
assert.match(copa, /volverDePractica\(\{ portada: true \}\)/, 'the standalone cover passes portada: nothing a result offers before playing');
assert.equal((copa.match(/volverDePractica\(\{ portada: true \}\)/g) || []).length, 1, 'only the cover passes portada');

console.log('✓ fin.test.mjs');
