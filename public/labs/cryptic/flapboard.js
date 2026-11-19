/**
 * Críptico's cover (the owner, 2026-11-19): a split-flap board, as in an airport, that flips through
 * several words of the name's length and stops on the game's name. Each tile runs through a few letters
 * before landing, left to right, with a short stagger. With reduced motion it shows the name at once.
 */

const FLIPS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
/** The words it passes through, per language; the last one is the game's name and has its length. */
export const BOARD_WORDS = {
  es: ['MISTERIO', 'ANAGRAMA', 'ACERTIJO', 'PALABRAS', 'SECRETOS', 'CRÍPTICO'],
  pt: ['MISTÉRIO', 'ANAGRAMA', 'PALAVRAS', 'SEGREDOS', 'CRÍPTICO'],
  en: ['MYSTERY', 'ANAGRAM', 'RIDDLES', 'SECRETS', 'CRYPTIC'],
};

const wait = ms => new Promise(ok => setTimeout(ok, ms));

/** Draws the board into `into` and plays it once. Returns a promise that settles on the name. */
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
  for (const [w, word] of words.entries()) {
    const last = w === words.length - 1;
    await Promise.all(tiles.map(async (t, i) => {
      await wait(i * 45);
      for (let k = 0; k < (last ? 5 : 3); k++) { flip(t, FLIPS[Math.floor(random() * FLIPS.length)]); await wait(55); }
      flip(t, word[i] || ' ');
    }));
    if (!last) await wait(650);
  }
  into.classList.add('flapboard--done');
}
