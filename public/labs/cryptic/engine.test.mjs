// node public/labs/cryptic/engine.test.mjs: the rules and the clues (C-12)
import assert from 'node:assert/strict';
import * as E from './engine.js';
import { LOCALES, KIND_KEYS, CLUE_LANG } from './rules.js';
import { CLUES } from './clues.js';
import { BOARD_WORDS } from './flapboard.js';
import { esJid } from '../../assets/js/records.js';

// Normalizing: accents go, Ñ stays, only letters
assert.equal(E.normalize(' jamón '), 'JAMON');
assert.equal(E.normalize('Ñandú'), 'ÑANDU');
assert.equal(E.normalize('o-c a!s'), 'OCAS');
assert.equal(E.enumeration('LEÓN'), '(4)');
assert.equal(E.enumeration('MEDIA NOCHE'), '(5,5)');

// Dates and the day's clue
assert.equal(E.numberOf(E.LAUNCH), 1);
assert.equal(E.numberOf('2026-11-20'), 2);
assert.equal(E.numberOf('2026-11-18'), 1, 'never 0 or less, for a player west of the launch');
assert.equal(E.addDays('2026-12-31', 1), '2027-01-01');
const bank = CLUES[CLUE_LANG];
const seen = new Set();
for (let i = 0; i < bank.length; i++) seen.add(E.indexOf(E.addDays(E.LAUNCH, i), bank.length));
assert.equal(seen.size, bank.length, 'every clue comes out once before any repeats');
assert.equal(E.indexOf(E.addDays(E.LAUNCH, bank.length), bank.length), E.indexOf(E.LAUNCH, bank.length), 'then the cycle repeats');
assert.equal(E.indexOf('2026-11-01', bank.length) >= 0, true, 'a date before the launch still has a clue');

// A round
const clue = { c: 'Ramo revuelto: lo que sientes por tu pareja', a: 'AMOR', k: 'anagram', d: 'lo que sientes por tu pareja', x: '' };
let s = E.newRound(0, { date: E.LAUNCH });
assert.equal(E.guess(s, '', clue).verdict, 'empty');
assert.equal(E.guess(s, 'AMORES', clue).verdict, 'length', 'a guess of another length is not counted');
let r = E.guess(s, 'mora', clue);
assert.equal(r.verdict, 'wrong');
s = r.state;
assert.deepEqual(s.guesses, ['MORA']);
s = E.hint(s); s = E.hint(s);
assert.equal(s.hints, 2);
r = E.guess(s, 'Amor', clue);
assert.equal(r.verdict, 'right');
s = r.state;
assert.ok(E.isOver(s));
assert.equal(E.stars(s), 1, 'three stars minus two hints');
assert.equal(E.guess(s, 'AMOR', clue).verdict, 'over', 'nothing moves after the end');
assert.equal(E.hint(s), s);
let h = E.newRound(0);
for (let i = 0; i < 5; i++) h = E.hint(h);
assert.equal(h.hints, E.MAX_HINTS, 'three hints at most');
const g = E.giveUp(E.newRound(0));
assert.ok(E.isOver(g) && !g.solved);
assert.equal(E.stars(g), 0);
assert.equal(E.stars(E.guess(E.newRound(0), 'AMOR', clue).state), 3, 'solved with no hints: three stars');

// The streak
const days = { '2026-11-17': { solved: true }, '2026-11-18': { solved: true }, '2026-11-19': { solved: true } };
assert.equal(E.streak(days, '2026-11-19'), 3);
assert.equal(E.streak(days, '2026-11-20'), 3, 'today not played yet: the streak holds');
assert.equal(E.streak(days, '2026-11-21'), 0, 'a missed day breaks it');
assert.equal(E.streak({ ...days, '2026-11-20': { solved: false } }, '2026-11-20'), 3, 'given up today: the streak up to yesterday');

// Every clue: a known kind, its definition inside it at one end, a unique answer, and its wordplay adds up
const sorted = w => [...E.normalize(w)].sort().join('');
for (const [lang, list] of Object.entries(CLUES)) {
  const answers = new Set();
  for (const c of list) {
    const tag = `${lang} ${c.a}`;
    assert.ok(KIND_KEYS.includes(c.k), tag + ': a known kind');
    assert.ok(c.c && c.x, tag + ': clue and explanation');
    // A player's clue names its author: the name shown and, if they had one, their player id (propose.js)
    if (c.by !== undefined) assert.ok(typeof c.by.n === 'string' && c.by.n.trim() && (c.by.j === undefined || esJid(c.by.j)), tag + ': its author');
    const at = c.c.indexOf(c.d);
    assert.ok(at >= 0, tag + ': the definition is in the clue word for word');
    assert.ok(at === 0 || at + c.d.length === c.c.length, tag + ': the definition is at one end');
    assert.ok(!answers.has(E.normalize(c.a)), tag + ': no answer twice');
    answers.add(E.normalize(c.a));
    assert.ok(!E.normalize(c.c).split(/\s+/).includes(E.normalize(c.a)), tag + ': the answer is not written in the clue');
    // The anagram's letters are in the explanation's first capitals; the hidden word runs across the quoted words
    if (c.k === 'anagram') {
      const fodder = c.x.match(/\b[A-ZÁÉÍÓÚÑ]{3,}(?: [A-ZÁÉÍÓÚÑ]{3,})*/)[0];
      assert.equal(sorted(fodder), sorted(c.a), tag + ': the anagram uses the same letters');
    }
    if (c.k === 'hidden') {
      const quoted = c.x.match(/«([^»]+)»/)[1];
      assert.ok(E.normalize(quoted).includes(E.normalize(c.a)), tag + ': the answer hides in the quoted words');
      assert.ok(E.normalize(c.c.replace(/\s+/g, '')).includes(E.normalize(c.a)), tag + ': and in the clue itself');
    }
    if (c.k === 'reversal') {
      const word = c.x.match(/\b[A-ZÁÉÍÓÚÑ]{3,}/)[0];
      assert.equal([...E.normalize(word)].reverse().join(''), E.normalize(c.a), tag + ': read backwards');
    }
  }
}
assert.ok(bank.length >= 30, 'a month of clues before any repeats');

// The texts: the same keys in every language, none empty (C-3)
const keys = Object.keys(LOCALES.es.ui).sort();
for (const [lang, L] of Object.entries(LOCALES)) {
  assert.deepEqual(Object.keys(L.ui).sort(), keys, lang + ': same keys as es');
  for (const k of keys) assert.ok(L.ui[k].trim(), lang + '.' + k + ' is not empty');
  assert.deepEqual(Object.keys(L.kinds).sort(), [...KIND_KEYS].sort(), lang + ': every kind named');
  assert.ok(L.como.length <= 3, lang + ': up to three steps (U-18)');
  assert.ok(L.como.join(' ').length <= 280, lang + ': how to play within 280 characters (U-18)');
}
// The cover's board: every word has the length of the name it lands on, in every language
for (const [lang, words] of Object.entries(BOARD_WORDS)) {
  const n = [...words.at(-1)].length;
  for (const w of words) assert.equal([...w].length, n, `${lang} ${w}: ${n} letters, like ${words.at(-1)}`);
  assert.equal(E.normalize(words.at(-1)), E.normalize(LOCALES[lang].ui.title), `${lang}: the board lands on the name`);
}
// A player's own clue (the owner, 2026-11-19): it is theirs to skip, never to play
const mine = [{ a: 'A' }, { a: 'B', by: { n: 'Ana', j: 'abcdefghijkl' } }, { a: 'C' }, { a: 'D', by: { n: 'Leo', j: 'mnopqrstuvwx' } }];
assert.ok(E.isAuthor(mine[1], 'abcdefghijkl') && !E.isAuthor(mine[1], 'mnopqrstuvwx') && !E.isAuthor(mine[0], 'abcdefghijkl') && !E.isAuthor(mine[1], null), 'the author is the player whose id the clue carries');
assert.deepEqual(E.practicePool(mine, 0, 'abcdefghijkl'), [2, 3], "practice leaves out today's clue and the player's own");
assert.deepEqual(E.practicePool(mine, 2, null), [0, 1, 3], 'without a player, practice leaves out only today\'s');

console.log('cryptic engine: ok');
