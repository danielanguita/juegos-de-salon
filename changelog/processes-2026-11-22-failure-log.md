level: patch

- **CI failure log reads the right attempt**: `failure-log.yml` now reads the log of the attempt that ended (`--attempt`), so a quick "Re-run failed jobs" no longer leaves an empty log and a bogus "no failing test found" record (signature f2f83772a2, four unrelated breaks counted as one). `failures.test.mjs` pins it.
