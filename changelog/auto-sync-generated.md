level: patch

- **PRs no longer sit in conflict for hours over generated files** (D-580): `wait-pr.mjs` brings a PR up to date by itself when the only conflicts are in the decisions index, `docs/facts.json` or the README's generated blocks.
