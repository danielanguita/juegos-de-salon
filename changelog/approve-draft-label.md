level: patch

- **Owner approvals**: ticking Yes on a 🔴 PR that is still a draft now marks it ready for review before merging, instead of failing (#1750, #1773); and when a tick carries to a new commit (only main merged in, D-575, or the owner's own PR with no 🔴 file changed, D-596) the `needs-owner` label goes too, as it does on the tick itself.
