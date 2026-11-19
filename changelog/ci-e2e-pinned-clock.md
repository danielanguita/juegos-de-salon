level: patch

- **Workshop: no end-to-end script depends on the real date** (D-589). The scripts that open a page following
  today (the home page and its ✨ New row, `/today/`, `/records/`, La Copa's create screen, the screen catalog
  of the languages scripts and `look.mjs`) open it on a pinned day, `launch({ clock: true })` in `cdp.mjs`, and
  `real-date.test.mjs` fails a new one that does not; `landing-fold.mjs` looks for each Uno al día game's day
  from that day on. On 2026-11-19 the day's Uno al día cover turned every PR red at UTC midnight.
