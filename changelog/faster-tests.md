level: patch

- **Faster tests**: the unit tests on each PR run in parallel (`tools/release/run-tests.mjs`), about 22 s instead of 72 s; locally the same command. Fixed a duplicated line in `CLAUDE.md` that split its table in two.
