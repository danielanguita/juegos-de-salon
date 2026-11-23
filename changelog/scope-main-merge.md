level: patch

- **Faster PRs after a merge of main**: a PR that already passed its tests and then takes the latest
  `main` reruns only its own end-to-end scope against it, no longer every script `main` brought (D-610).
  #1802 waited half an hour for 18 batches after its own 8-minute test had passed.
