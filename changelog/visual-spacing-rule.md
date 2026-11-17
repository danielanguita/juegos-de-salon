level: patch

- **Every visual change is measured before it ships** (D-570, DESIGN.md rule 10): a new check, M-4, fails a screen where a picture, a panel or a title sits on the block before it, on every screenshot the end-to-end scripts take, and the process asks each screen whose look changes to be shot, measured with `look.mjs` at 390 and 320 px, and listed as measured in its PR.
