level: patch

- **La Copa notifications no longer stop for hours** (D-574): each heartbeat run on GitHub starts the next one before it ends, instead of waiting for GitHub's schedule, which left about 3 hours without notifications in each cycle.
