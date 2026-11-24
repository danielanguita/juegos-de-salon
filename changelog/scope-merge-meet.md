level: patch

- **Behind the scenes**: when a PR takes in the latest `main` (by hand or from the merge queue), its end-to-end run repeats only the scripts that both the PR's own changes and what `main` brought reach, not the PR's whole scope (D-612). Over the last 89 such merges that is 752 batches instead of 1092, about 2,800 script minutes fewer, so PRs in the merge queue wait less.
