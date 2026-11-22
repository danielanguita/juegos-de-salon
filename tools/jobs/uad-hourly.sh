#!/usr/bin/env bash
# Uno al día's hourly rebuild (D-415, D-500), run by the heartbeat (notifications.yml, D-565) and by
# hand from uad-rebuild.yml. Needs $FIREBASE_KEY. $1 = --apply to write (anything else: only say).
# In the 08 UTC hour, or when $ALWAYS_RETENTION is set, it also deletes the old names in the statistics (D-472).
set -e
APPLY="$1"
# Chile's date: the app's days and months are Chile's
month=$(TZ=America/Santiago date +%Y-%m)
node tools/firebase/uad-points-backfill.mjs --rebuild $APPLY --month "$month"
if [ "$(TZ=America/Santiago date +%d)" -le 3 ]; then
  node tools/firebase/uad-points-backfill.mjs --rebuild $APPLY --month "$(TZ=America/Santiago date -d "$month-01 -1 day" +%Y-%m)"
fi
# The players who renamed themselves in their profile (D-600): their table rows take the new name
node tools/firebase/rename-player.mjs --pending $APPLY || echo "::warning::the self-renames did not finish; the next hour tries again"
if [ "$(date -u +%H)" = 08 ] || [ -n "$ALWAYS_RETENTION" ]; then node tools/firebase/stats-retention.mjs $APPLY; fi
if [ "$APPLY" = --apply ]; then node tools/push/heartbeat-watch.mjs uad; fi
