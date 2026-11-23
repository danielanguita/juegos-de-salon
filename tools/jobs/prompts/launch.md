# Launch at a set time (D-529, D-591)

The prompt of the one-time **cloud** scheduled tasks that launch a game or a campaign. Never a desktop-app
task or anything on the Mac mini (D-591). Each launch gets two tasks from this prompt, created from a cloud
session the owner opened or `/schedule` inside the repo (a session another session started is denied, docs/LAUNCH.md §3), with the repository attached with write access:

- **launch**, at the launch time: MODE=launch.
- **alarm**, about 10 minutes later: MODE=check.

Fill in before creating them: FLAGS (space-separated), SPLASH, TURN_OFF, NOT_BEFORE (ISO, UTC), UNTIL
(ISO, UTC), FIRST (true/false).

## The task

You run unattended in Claude's cloud for the repository ellokojavi/juegos-de-salon. Nobody will answer
questions. Do only this:

1. If MODE=launch: `gh workflow run launch.yml --repo ellokojavi/juegos-de-salon -f flags="FLAGS"
   -f splash="SPLASH" -f turn_off="TURN_OFF" -f not_before="NOT_BEFORE" -f until="UNTIL" -f first=FIRST`,
   then wait for that run (`gh run list --workflow launch.yml -L 1`, `gh run watch <id> --exit-status`).
   If it ran before NOT_BEFORE and wrote nothing, wait a minute and dispatch again (at most 5 times).
2. Check (both modes), reading `https://juegos-de-salon-default-rtdb.firebaseio.com/<path>.json`:
   each `flags/<id>` of FLAGS has `state: "all"`; `splash/SPLASH` has `on: true` and `until: UNTIL`;
   each `splash/<id>` of TURN_OFF has `on: false`. Each launched game's page on https://juegosdesalon.cl/
   answers 200. If it can, also run `node tools/agents/launch-check.mjs <ids> --live` and
   include a ✗ in the notification.
3. Send the owner one push notification in Spanish: «✅ Lanzado: …» when everything checks, or
   «🚨 Lanzamiento NO aplicado: …» with what failed. In MODE=check, send it only when something failed
   (a silent alarm means all is well).
