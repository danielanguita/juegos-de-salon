import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkClue, boardM3, m3Rate } from './checks.mjs';

const read = f => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));
const known = read('./known.json'), cases = read('./cases.json');

// The checks see what they should
assert.deepEqual(checkClue({ pista: 'MAR', si: ['OLA', 'BARCO', 'SAL', 'PLAYA', 'ANCLA', 'ISLA', 'PUERTO', 'TIBURÓN', 'FARO'], casi: ['RÍO', 'LAGO', 'CHARCO'] }), []);
assert.ok(checkClue({ pista: 'MAR', si: ['MARINO'], casi: [] }).some(h => h.id === 'M2'));
assert.ok(checkClue({ pista: 'X', si: ['dos palabras'], casi: [] }).some(h => h.id === 'M1'));
const board = { pistas: [{ pista: 'A', n: 2 }, { pista: 'B', n: 3 }], cartas: [{ tipo: 'agente', p: 0 }, { tipo: 'neutral', tienta: 0 }, { tipo: 'asesino', tienta: 0 }] };
assert.deepEqual(boardM3(board).map(h => h.id), ['M3']);
assert.deepEqual(boardM3({ ...board, cartas: board.cartas.slice(0, 2) }), []);

// The live decks: no M1/M2 hit beyond the known debt (U-21: decks are not edited mid-Cup)
for (const [lang, file] of [['es', 'clues.js'], ['en', 'clues-en.js'], ['pt', 'clues-pt.js']]) {
  const { PISTAS } = await import(`../../../public/cup/games/agents/${file}`);
  const hits = PISTAS.flatMap(x => checkClue(x).map(h => `${x.pista} ${h.id}: ${h.msg}`)).sort();
  for (const h of hits) assert.ok(known[lang].includes(h), `${lang}: new defect ${h}`);
  const { bad, n } = m3Rate(lang, 60);
  assert.equal(bad, 0, `${lang}: ${bad} of ${n} boards break M3, which generar enforces (D-583)`);
}

// The eval cases: the owner's 20 labels exist in the deck, and each bad case breaks what it says
const { PISTAS: ES } = await import('../../../public/cup/games/agents/clues.js');
assert.equal(cases.labelled.length, 20);
for (const c of cases.labelled) assert.ok(ES.some(x => x.pista === c.pista), `labelled ${c.pista} is in the deck`);
assert.ok(cases.bad.length >= 6);
for (const c of cases.bad.filter(c => c.breaks.startsWith('M'))) assert.ok(checkClue(c.entry).some(h => h.id === c.breaks), `${c.entry.pista} breaks ${c.breaks}`);
console.log('clues: ok');
