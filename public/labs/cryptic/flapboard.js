/**
 * Críptico's cover (the owner, 2026-11-19): a split-flap board, as in an airport, that flips through
 * several words of the name's length, the name among them, in an endless loop (the owner asked for it always
 * moving). With reduced motion it shows the name, still.
 */

const FLIPS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
/** The words it passes through, per language; the last one is the game's name and has its length. */
export const BOARD_WORDS = {
  es: ['MISTERIO', 'ANAGRAMA', 'ACERTIJO', 'PALABRAS', 'SECRETOS', 'CRÍPTICO'],
  pt: ['MISTÉRIO', 'ANAGRAMA', 'PALAVRAS', 'SEGREDOS', 'CRÍPTICO'],
  en: ['MYSTERY', 'ANAGRAM', 'RIDDLES', 'SECRETS', 'CRYPTIC'],
};

const wait = ms => new Promise(ok => setTimeout(ok, ms));

const WAVE = 110;      // ms between one tile and the next as a word comes in
const SPINS = 4;       // random letters a tile runs through before landing
const SPIN = 60;       // ms per random letter
const HOLD = 1700;     // ms a word stays (the name, NAME_HOLD), while its tiles keep flapping in place
const NAME_HOLD = 2800;
const IDLE = 170;      // ms between two flaps in place while a word holds

/** Is the cover on screen? The board rests while it is not, and while the tab is hidden. */
const watching = into => !document.hidden && !!into.closest('.screen.active');

/**
 * Draws the board into `into` and plays it in a loop: each word comes in as a wave, tile by tile with a
 * short offset, and while it holds its tiles keep flapping in place, so the board never stops and the
 * word still reads. The name holds longest. With reduced motion (or ?test) it shows the name, still.
 */
export async function flapboard(into, lang = 'es', { random = Math.random } = {}) {
  const words = BOARD_WORDS[lang] || BOARD_WORDS.es;
  const name = words.at(-1);
  const tiles = [...name].map(() => {
    const t = document.createElement('span');
    t.className = 'flap';
    t.textContent = ' ';
    return t;
  });
  into.replaceChildren(...tiles);
  into.style.setProperty('--tiles', String(tiles.length));
  into.setAttribute('aria-label', name);
  into.setAttribute('role', 'img');
  const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches || /[?&]test\b/.test(location.search);
  if (still) { tiles.forEach((t, i) => { t.textContent = name[i]; }); return; }

  const flip = (t, ch) => {
    t.textContent = ch;
    t.classList.remove('flap--tick');
    void t.offsetWidth;
    t.classList.add('flap--tick');
  };
  const pick = () => FLIPS[Math.floor(random() * FLIPS.length)];
  for (let w = 0; ; w = (w + 1) % words.length) {
    while (!watching(into)) await wait(500);
    const word = words[w];
    // The wave: tile i starts i × WAVE after the first, spins, and lands on its letter
    await Promise.all(tiles.map(async (t, i) => {
      await wait(i * WAVE);
      for (let k = 0; k < SPINS; k++) { flip(t, pick()); await wait(SPIN); }
      flip(t, word[i] || ' ');
    }));
    into.classList.toggle('flapboard--done', w === words.length - 1);
    // The hold: one tile at a time flaps back onto its own letter, so something always moves
    const until = Date.now() + (w === words.length - 1 ? NAME_HOLD : HOLD);
    let last = -1;
    while (Date.now() < until) {
      let i = Math.floor(random() * tiles.length);
      if (i === last) i = (i + 1) % tiles.length;
      last = i;
      flip(tiles[i], word[i] || ' ');
      await wait(IDLE);
    }
  }
}
