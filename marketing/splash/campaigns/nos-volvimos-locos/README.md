# 🤪 ¡Nos volvimos locos! (`nos-volvimos-locos`)

One window for the launch of the house's next two skill games, 🐸 Croc! and ⚖️ Tembleque (the owner's
request, 2026-11-21: one splash for both, real play in the clips with zoom or some movement, Play to each
game's cover so a newcomer sees what it is first; made now and kept off).

| | |
|---|---|
| Texts | title "¡Nos volvimos locos!" · lead "No paramos de lanzar juegos. Hoy entran 2 de destreza." (both the owner's); each card its name, what you do in it and ▶ Jugar; in es, en and pt |
| Layout | two items, one under the other, like `dominorama-memorice`, with `bigClips`: on a phone each clip takes what the screen's height leaves for it (193 px on a 412×780 Pixel 9 instead of 104), up to about half its card, and the window grows taller; the texts are never cut |
| Croc! | `game: 'croc'`, Play → `labs/croc/` (its cover). Text: cross the highway dodging cars to the pond |
| Tembleque | its own name and ⚖️ (it is not in `games.js` yet), Play → `labs/wobbles/` (its cover, with the level lever). Text: stack without tipping the scale, pick easy or hard. Never "2D" or "3D" (the owner) |
| Clips | `assets/splash/croc-<lang>.mp4` and `wobbles-<lang>.mp4`, one per language because the games write words on their canvas (¡CERCA!, ¡CLAVADO!, NUEVA: LADRILLO). Recorded by [`croc-wobbles-clip.mjs`](../../croc-wobbles-clip.mjs): a bot plays the real game, frame by frame, and a camera pushes in on each dash, fruit, close call and balanced drop. Croc! crosses the whole road to the pond (12 s); Tembleque plays easy, then zooms into hard with its opening turn (12.7 s) |
| Waits for | `requires: ['croc', 'wobbles']`: unseen until both launch flags are on for the visitor (D-517); until then only lab key holders see it |
| On | **off**: not in `ACTIVE`. At launch, switch it on in the panel's 📣 Campaigns |

## For the launch PR

- Tembleque enters `games.js`: its item becomes `game: 'wobbles'` (its emoji then comes from there, rule 9) and loses its own `title` and `emoji`.
- Both games leave `public/labs/`: `href` points at their new folders (`croc/`, `wobbles/`). The old lab paths become bridges (C-18), so the links keep working even if this is missed.
- The flags `croc` and `wobbles` must exist in `FLAGS` with exactly these ids, or change `requires`.
- Tembleque's clip shows the cheers (¡CLAVADO!, ¡MAESTRO!) of the lab flag `wobbles-cheers`; if that flag is not on for everyone at launch, record it again with it off.

## History

- **2026-11-21:** made, kept off until both games launch.
- **2026-11-21 (bigger clips):** on the owner's Pixel 9 the clips felt small (104 px). `bigClips` makes them as big as the phone's height allows, about 193 px there, the window taller; only this campaign has it.
