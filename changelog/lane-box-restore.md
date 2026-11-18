level: patch

- **The owner's approval box on a 🔴 PR stays put**: if anyone but the owner edits the description and drops or changes the box, a new workflow (`lane-box.yml`) puts it back as it was. PR 1589 lost its box when a contributor's session rewrote its description.
