// Generated from game.json by node tools/generators/manifests.mjs: do not edit by hand.
export default {
  "id": "microgames",
  "path": "in-a-flash/",
  "emoji": "⚡",
  "name": {
    "es": "¡Al toque!",
    "en": "In a Flash!",
    "pt": "Na Hora!"
  },
  "tagline": {
    "es": "Una orden y 3 segundos para cumplirla: diez seguidos, cada vez más rápido.",
    "en": "One order and 3 seconds to do it: ten in a row, faster and faster.",
    "pt": "Uma ordem e 3 segundos para cumprir: dez seguidos, cada vez mais rápido."
  },
  "keywords": {
    "es": [
      "al toque",
      "microjuegos",
      "rápido",
      "rapido",
      "reflejos",
      "habilidad",
      "toca",
      "arrastra",
      "desliza",
      "warioware",
      "pinball"
    ],
    "en": [
      "in a flash",
      "microgames",
      "fast",
      "quick",
      "reflexes",
      "skill",
      "tap",
      "drag",
      "swipe",
      "warioware",
      "pinball"
    ],
    "pt": [
      "na hora",
      "microjogos",
      "rápido",
      "reflexos",
      "habilidade",
      "toque",
      "arraste",
      "deslize",
      "warioware",
      "pinball"
    ]
  },
  "players": {
    "min": 1,
    "max": 1
  },
  "duration": "1–2",
  "tipos": [
    "skill"
  ],
  "nuevoDesde": "2026-11-15",
  "available": true,
  "modes": [
    "solo"
  ],
  "ai": false,
  "memory": "juegos-de-salon:microgames:session",
  "languages": [
    "es",
    "en",
    "pt"
  ],
  "firebasePaths": [],
  "canonExceptions": [
    {
      "canon": "C-3",
      "why": "No LOCALES in rules.js: its English and Portuguese are keyed by the Spanish written where each text is used, inside t('…'); rules.test.mjs checks every t() has both."
    },
    {
      "canon": "C-2",
      "why": "rules.js holds the translations keyed by the Spanish, not LOCALES by key: the short texts spread over 29 microgames read better where they are used."
    },
    {
      "canon": "C-6",
      "why": "A run is short (about a minute and a half) and is not resumed: nothing goes through session.js; only the best run and the run of the day are kept."
    }
  ]
};
