# The splash's clips

A few seconds of each game being played, for the promotional splash over the home page (D-351).
They replace a still picture: the owner found the link cards repeated the texts next to them.

| | |
|---|---|
| Files | `public/assets/splash/<game>.mp4` (360×360, 12 fps, muted, loops) and `<game>.jpg` (its poster: the board solved) |
| Games | 🚇 Rutas rotas (`routes`), 📐 Loteo (`plots`), 🖌️ Pintaminas (`paint-mines`), 🚂 Tren en Vilo (`bridges`), 👀 Memorice (`memory`, with `memory-start.jpg`, recorded behind its flag with `flags`) |
| Made by | [`capture.mjs`](capture.mjs): the real game in headless Chrome, its solution played slowly while the board is shot |

## How to rebuild them

```bash
python3 -m http.server 8771 -d public &                          # the worktree's site
SITE=http://localhost:8771 node marketing/splash/capture.mjs [routes|plots|paint-mines|bridges]
```

A new game: one entry in `GAMES` in `capture.mjs` (its page, its board's selector, when it is
ready, and how to play its solution through the game's test hook), then its item in the campaign
(`video` and `img` in `public/assets/js/splash.js`).

The making-of page (`/making-of/`) has its own clips (Where Is It?, Liar's Dice, Shinobi, Babel: 2x,
in English, for projecting), recorded by [`tools/generators/making-of-clips.mjs`](../../tools/generators/making-of-clips.mjs)
into `public/making-of/clips/`; its header says how to run it.

## Real play of an action game (Croc!, Tembleque)

A game that moves on its own (a timer, physics, traffic) cannot be shot like a board: a headless
recorder drops frames, and a solution played slowly looks fake. The way that worked for
`nos-volvimos-locos` (2026-11-21), in [`croc-wobbles-clip.mjs`](croc-wobbles-clip.mjs), which a new game
copies or imports (`take`, `EASY`, `HARD` are exported; Tembleque's cover loops reuse them):

1. **Drive the page's clock.** Before the page loads (`Page.addScriptToEvaluateOnNewDocument`),
   `performance.now` and `requestAnimationFrame` are replaced; `__tick(ms)` moves time on and runs one
   frame. The recording is smooth whatever the machine, and the same seed plays the same take every time.
   Not MediaRecorder: headless throttles it (35 frames for 12 s).
2. **A bot through the game's own input.** Through its test hook (`window.__croc.act`, `window.__balanza`)
   or its real events (pointer, keys); never by moving its state by hand. Make it play well enough to show
   the good moments (a fruit, a dash, a balanced drop), with a fixed `seed`.
3. **Keep the game's picture at full quality.** A game that lowers its resolution when frames come slowly
   needs its own switch (`?quality=1`) and 60 frames a second (`sub: 2`).
4. **An in-page camera.** Each frame, the game's canvas is drawn into a fixed-size canvas through a
   camera (`z`, `x`, `y`, eased each frame) and saved with `toDataURL`; ffmpeg encodes the JPEGs
   (libx264, crf 27–29, `+faststart`, no audio). The camera reads the game's state to know where the
   action is.
5. **Words on the canvas.** If the game writes words (¡CERCA!, ¡CLAVADO!), either record one clip per
   language (`video: { es, en, pt }` in the campaign) or leave them out of the take by patching
   `fillText`/`strokeText` for strings with letters (the cover loops: one clip for every language).
6. **An endless loop.** Record N frames, keep frames B…N, and crossfade the last B into frames 0…B
   (`xfade=fade`, B = 0.8 s). Push the camera in a little at both ends, so the seam joins two shots
   framed alike. The poster is frame B, the loop's first.
7. **Look at it before anyone else.** A contact sheet (`ffmpeg … select='not(mod(n,25))',tile=4x4`) shows
   every framing problem at once: something cut at the edge, the action out of the shot.
8. **Measure the window** with `tools/e2e/splash/margins.mjs` at 390×844, 360×640 and 1440×900 (D-570),
   and give the owner a live link, never a file: a lab key on juegosdesalon.cl, or the PR's preview
   (which needs its own `?key=` once per browser, PREVIEWS.md).

What the owner said, so the next one starts there:

- **Zoom little.** "Mucho zoom que marea": Tembleque's cover's first camera followed each fall and pushed
  in up to 1.7×; the calm one leans in 4–14 % as a piece lands, eases slowly (5 % a frame) and breathes
  about 1 %. Movement should come from the game, not the camera.
- **Show what the card says.** The easy loop's card names the claw, and the first shot left it out of
  frame: a wider shot shows the claw's rail whole (usability, U-36).
- **Clips big enough on a real phone.** 104 px felt small on a Pixel 9: `bigClips` (README).
- **Play opens the cover, not the game**, so a newcomer sees what it is first.

## Teasers

A game that is still coming gets a drawn scene instead of its play (D-430): a page in
[`teaser/`](teaser/) draws each frame with the game's own sprites, and [`teaser.mjs`](teaser.mjs)
turns it into `public/assets/splash/<game>-teaser.mp4` (512×320, crisp pixel art; a GIF until #846,
five times heavier), its first frame `<game>-teaser-start.png` as the poster and a `<game>-teaser.png`
still for reduced motion. Its item has only the picture (`video`, `img`, `still`, `ratio`).

```bash
node marketing/splash/teaser.mjs [bridges]
```

## History

- **v1 · 2026-10-18:** the three games out of the lab (D-332), for the demo campaign `tres-juegos-demo`.
- **Teaser v1 · 2026-10-22:** 🚂 Tren en Vilo (`bridges`), still in the lab, for `tren-en-vilo-pronto` (D-430).
- **v2 · 2026-10-26:** 🚂 Tren en Vilo (`bridges`) out of the lab, for `tren-en-vilo-ya`: a wood stage
  built beam by beam (the mouse drags each beam of its known solution), then the train crosses. It ends
  as the train leaves, before the stage's summary covers the board; the poster is that last frame.
- **2026-11-21:** 🐸 Croc! and ⚖️ Tembleque, still in the lab, for `nos-volvimos-locos`: [`croc-wobbles-clip.mjs`](croc-wobbles-clip.mjs) drives the page's clock frame by frame while a bot plays the real game, and a camera pushes in on what happens (a dash, a fruit, a balanced drop). One clip per language (`croc-<lang>.mp4`, `wobbles-<lang>.mp4`), since both games write words on their canvas; a campaign's `video`, `img` and `still` can now be `{ es, en, pt }`. Tembleque's goes from easy into hard through a zoom. The way it was made, and what to repeat, is in
  "Real play of an action game" above. The recorder is shared: it exports `take`, `EASY` and `HARD`, and [`tools/generators/wobbles-cover.mjs`](../../tools/generators/wobbles-cover.mjs) borrows them for Tembleque's cover loops (`public/wobbles/cover/{easy,hard}.mp4`, no words, one clip for every language).
- **2026-11-21 (Tembleque's cover):** its cover's SVG drawing became a 10 s loop of each level
  (`public/wobbles/cover/{easy,hard}.mp4`, [`tools/generators/wobbles-cover.mjs`](../../tools/generators/wobbles-cover.mjs)),
  no words, a crossfade at the seam. The first camera was too much ("mucho zoom que marea"); the second is calm.
