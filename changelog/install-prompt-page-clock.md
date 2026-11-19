level: patch

- **The install invitation's e2e check reads the page's clock**: since the scripts run on a fixed day (D-589), the check that the ✕ snoozes the invitation 14 days compared the page's date with node's real one, and went red on every PR that ran it from 2026-11-19 on. `real-date.test.mjs` now fails a pinned script whose check reads node's clock.
