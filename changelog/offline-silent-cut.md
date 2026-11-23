level: patch

- **Offline mode switches to Candlelight in seconds in airplane mode**, also on phones that keep saying they are online (common on iPhone): a failed connection check is confirmed 3 s later instead of a minute later, checks run every 20 s while the page is in view and none while it is hidden, and the app looks again each time it comes back to the front. It took up to two minutes; now at most ~23 s, ~5 s on returning to the app.
