level: patch

- **Shinobi**: the rising tick sound while the stick grows is gone; landings and falls keep their sounds and vibration.
- **Shinobi**: holding the stick no longer buzzes the phone: the stage really gets `touch-action: none` now (base.css gave every `role="button"` `manipulation`, which left Android's long-press on), and touch, selection and drag defaults are blocked.
