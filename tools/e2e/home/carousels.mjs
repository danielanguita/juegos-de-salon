// The home page as carousels (lab flag home-carousels): with the flag on, the filters and the list's cards
// give way to rows that slide sideways (popular, new, with friends, quick, one per type; favourites once one
// is marked), every game of the home page is in at least one, and a tap on a game opens its sheet with the
// details, its ranking, the ⭐ and ▶ Jugar. At 390 and 320 px, in the three languages; with the flag off the
// home page is the one everybody sees. Each shot measures margins, overlaps and spacing by itself (D-570).
// Prints ✗ if something fails.
import { output } from '../output.mjs';
import { launch, sleep } from '../cdp.mjs';
const OUT = output('/tmp/home-carousels');
const SITE = process.env.SITE || 'http://localhost:8765';
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) failures++; };

for (const width of [390, 320]) {
  const b = await launch({ dir: `${OUT}/p${width}`, out: OUT, width, height: width === 390 ? 844 : 640, clock: true });
  const ev = e => b.evaluate(e);
  const waitFor = async (expr, ms = 8000) => { for (let t = 0; t < ms; t += 100) { if (await ev(expr)) return true; await sleep(100); } return false; };

  // Flag off (the tests hold it off, flags-held.json): the home page as it is
  await b.go(`${SITE}/?test&lang=es`);
  await sleep(1500);
  ok(await waitFor(`!!document.querySelector('.filtros .tipos button')`) && await ev(`!document.querySelector('.shelves') && !document.documentElement.classList.contains('carousels')`),
    `${width}: flag off, the filters and the list, no carousels`);

  b.flags({ 'home-carousels': 'all' });
  for (const lang of ['es', 'en', 'pt']) {
    await b.go(`${SITE}/?test&lang=${lang}`);
    ok(await waitFor(`document.querySelectorAll('.shelf').length >= 5`), `${width} ${lang}: the carousels are drawn`);
    const page = await ev(`(() => {
      const vis = e => !!e && e.getClientRects().length > 0;
      const tiles = [...document.querySelectorAll('.shelf-tile')];
      const cards = [...document.querySelectorAll('#games .game-slot > .game-card[href]')].map(c => c.dataset.id);
      const inRows = new Set(tiles.map(t => t.dataset.id));
      return {
        filters: vis(document.getElementById('filtros')), list: vis(document.querySelector('#games .game-slot')),
        cup: vis(document.querySelector('.game-card.torneo')), dice: vis(document.querySelector('.btn-azar')),
        scroll: document.documentElement.scrollWidth <= innerWidth,
        missing: cards.filter(id => !inRows.has(id)),
        small: tiles.filter(t => t.offsetHeight < 44 || t.offsetWidth < 44).length,
        overflow: tiles.filter(t => t.scrollWidth > t.clientWidth + 1).map(t => t.dataset.id),
        labels: !!document.querySelector('.shelf .nuevo, .shelf .popular'),
        slides: [...document.querySelectorAll('.shelf-row')].some(r => r.scrollWidth > r.clientWidth),
        titles: [...document.querySelectorAll('.shelf h2')].map(h => h.textContent.trim()),
        fold: [...document.querySelectorAll('.shelf-tile')].some(t => t.getBoundingClientRect().top < innerHeight),
      };
    })()`);
    ok(!page.filters && !page.list, `${width} ${lang}: no filters and no list cards`);
    ok(page.cup && page.dice, `${width} ${lang}: La Copa and the dice stay`);
    ok(page.scroll, `${width} ${lang}: the page does not scroll sideways`);
    ok(page.missing.length === 0, `${width} ${lang}: every game of the home page is in a carousel${page.missing.length ? ' (missing: ' + page.missing.join(', ') + ')' : ''}`);
    ok(page.small === 0 && page.overflow.length === 0, `${width} ${lang}: every tile is 44 px or more and holds its text${page.overflow.length ? ' (' + page.overflow.join(', ') + ')' : ''}`);
    ok(!page.labels && page.slides, `${width} ${lang}: no New or Popular labels, and a row slides`);
    console.log(`  rows: ${page.titles.join(' · ')}`);
    await b.shot(`carousels-${width}-${lang}`);

    if (lang !== 'es') continue;
    // The second screen of rows, for the measures of every shot
    await ev(`scrollTo(0, document.querySelector('.shelves').getBoundingClientRect().top + scrollY - 12); 1`);
    await sleep(300);
    await b.shot(`carousels-${width}-rows`);

    // A tap opens the game's sheet: its name, the details, ▶ Jugar to its page
    const id = await ev(`(() => { const t = document.querySelector('[data-shelf="friends"] .shelf-tile'); t.click(); return t.dataset.id; })()`);
    ok(await waitFor(`!!document.querySelector('#game-sheet[data-id="${id}"]')`), `${width}: a tap on ${id} opens its sheet`);
    await sleep(500); // the sheet slides up
    const sheet = await ev(`(() => {
      const s = document.getElementById('game-sheet'), card = document.querySelector('#games .game-card[data-id="${id}"]');
      const play = document.getElementById('btn-game-sheet-play'), r = play.getBoundingClientRect();
      return { name: s.querySelector('h2').textContent === card.querySelector('h2 span').textContent,
        tag: s.querySelector('#game-sheet-details p').textContent === card.querySelector('.tag').textContent,
        href: play.href === card.href, seen: r.top >= 0 && r.bottom <= innerHeight && r.height >= 44,
        chips: s.querySelectorAll('.chip').length, tabs: s.querySelectorAll('.hoja-pestana[role=tab]').length,
        fits: s.scrollWidth <= s.clientWidth + 1, focus: document.activeElement === play };
    })()`);
    ok(sheet.name && sheet.tag && sheet.href, `${width}: the sheet says the game's name and line, and ▶ Jugar goes to its page`);
    ok(sheet.seen && sheet.focus && sheet.fits, `${width}: ▶ Jugar is in sight, focused, and the sheet fits the screen`);
    ok(sheet.chips >= 3 && sheet.tabs === 2, `${width}: who plays, how long and its type; two tabs`);
    await b.shot(`carousels-${width}-sheet`);

    // A game of La Copa plays its cover animation on top of the details, framed; a game with none has no frame
    await ev(`document.getElementById('btn-game-sheet-close').click(); document.querySelector('.shelf-tile[data-id="stick"]').click(); 1`);
    ok(await waitFor(`!!document.querySelector('#game-sheet[data-id="stick"] #game-sheet-demo.on')`, 10000), `${width}: Shinobi's sheet plays its cover animation`);
    await sleep(600);
    const demo = await ev(`(() => { const f = document.getElementById('game-sheet-demo').getBoundingClientRect(), p = document.querySelector('#game-sheet-details p').getBoundingClientRect(), r = document.getElementById('btn-game-sheet-play').getBoundingClientRect(), s = document.getElementById('game-sheet');
      return { h: Math.round(f.height), above: f.bottom <= p.top + 1, play: r.top >= 0 && r.bottom <= innerHeight, fits: s.scrollWidth <= s.clientWidth + 1 }; })()`);
    ok(demo.h >= 60 && demo.above && demo.play && demo.fits, `${width}: the animation (${demo.h} px) sits above the game's line, ▶ Jugar still in sight`);
    await b.shot(`carousels-${width}-sheet-demo`);
    await ev(`document.getElementById('btn-game-sheet-close').click(); document.querySelector('[data-shelf="friends"] .shelf-tile').click(); 1`);
    ok(await waitFor(`!!document.querySelector('#game-sheet[data-id="${id}"]')`) && await ev(`!document.getElementById('game-sheet-demo')`), `${width}: ${id}, not a game of La Copa, has no frame`);
    await sleep(500);

    // One height for both tabs: the sheet does not move when the tab changes
    const tall = () => ev(`Math.round(document.getElementById('game-sheet').getBoundingClientRect().height)`);
    await sleep(1500);
    const before = await tall();
    // The ranking tab reads the game's table; ▶ Jugar stays in sight under it
    await ev(`document.getElementById('game-sheet-tab-ranking').click(); 1`);
    ok(await waitFor(`!!document.querySelector('#game-sheet-ranking .rk-lista') && document.getElementById('game-sheet-details').inert && !document.getElementById('game-sheet-ranking').inert`), `${width}: the Ranking tab shows the game's ranking`);
    await sleep(1200);
    ok(await ev(`(() => { const r = document.getElementById('btn-game-sheet-play').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()`), `${width}: ▶ Jugar still in sight under the ranking`);
    await b.shot(`carousels-${width}-ranking`);
    const inRanking = await tall();
    await ev(`document.getElementById('game-sheet-tab-details').click(); 1`);
    await sleep(300);
    ok(before === inRanking && inRanking === await tall(), `${width}: the sheet keeps one height in Detalles and Ranking (${before} → ${inRanking} px)`);

    // The ⭐ marks a favourite: its row appears first, and the sheet stays open
    await ev(`document.getElementById('btn-game-sheet-fav').click(); 1`);
    ok(await waitFor(`document.querySelector('.shelf-row')?.dataset.shelf === 'favorites' && !!document.querySelector('[data-shelf="favorites"] [data-id="${id}"]')`) && await ev(`!!document.getElementById('game-sheet')`),
      `${width}: the ⭐ adds the game to a Favourites row, first`);

    // Escape closes it and gives the focus back to a tile of that game
    await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    ok(await waitFor(`!document.getElementById('game-sheet')`) && await ev(`document.activeElement?.dataset?.id === '${id}' && document.body.style.position !== 'fixed'`),
      `${width}: Escape closes the sheet, the focus goes back to the game and the page scrolls again`);
    await ev(`localStorage.removeItem('juegos-de-salon:favoritos'); 1`);

    // The next visit hides the filters before the modules arrive (this phone remembers the flag)
    ok(await ev(`localStorage.getItem('juegos-de-salon:home-carousels') === '1'`), `${width}: this phone remembers the flag for the next visit`);
  }

  // Switched off again: the next visit draws the list and forgets
  b.flags({ 'home-carousels': 'off' });
  await b.go(`${SITE}/?test&lang=es`);
  ok(await waitFor(`!document.documentElement.classList.contains('carousels') && !document.querySelector('.shelves') && !!document.querySelector('.filtros .tipos button')`)
    && await ev(`localStorage.getItem('juegos-de-salon:home-carousels') === null && document.querySelector('#games .game-slot').getClientRects().length > 0`),
    `${width}: flag off again, the list and the filters are back`);
  b.close();
}

console.log(failures ? `✗ ${failures} failure(s)` : '✓ home/carousels.mjs');
process.exit(failures ? 1 : 0);
