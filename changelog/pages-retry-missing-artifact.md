level: patch

- **Publishing retries a deploy that could not find the site package yet**: three publishes on 2026-11-15 (#1467 among them) failed because GitHub had not yet made the just-uploaded site visible to the deploy step; `pages-5xx.mjs` now retries that case a minute later, as it does a 5xx (D-506).
