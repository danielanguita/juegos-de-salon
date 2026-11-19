level: patch

- **Workshop: a PR that changes a screen on purpose gets the runner's visual reference on its own.** The
  session commits the reference it made with `visual.mjs --update --part <game>`; the Visual references
  workflow remakes exactly the references the PR changes on GitHub's runner and commits them to the branch,
  with a token that starts the checks again, so the Mac's ~2 % pixel difference no longer turns
  `end-to-end` red and needs no second push (#1624, #1626, #1629). Never on a fork's PR; a screen nobody
  approved still fails the check.
