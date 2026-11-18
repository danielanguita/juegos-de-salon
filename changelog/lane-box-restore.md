level: patch

- **The owner's approval box on a 🔴 PR stays put**: if anyone but the owner edits the description and drops or changes the box, a new workflow (`lane-box.yml`) puts it back as it was. PR 1589 lost its box when a contributor's session rewrote its description.
- **A 🔴 PR the owner already answered loses its `needs-owner` label**: once the Yes (merged) or the No is carried out, the label goes, so the list of PRs waiting for the owner shows only those still waiting.
