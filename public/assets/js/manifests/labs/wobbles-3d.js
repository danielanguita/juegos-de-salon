// Generated from game.json by node tools/generators/manifests.mjs: do not edit by hand.
export default {
  "id": "wobbles-3d",
  "path": "labs/wobbles-3d/",
  "emoji": "⚖️",
  "name": {
    "es": "Tembleque 3D",
    "en": "The Wobbles 3D",
    "pt": "Tremelique 3D"
  },
  "tagline": {
    "es": "Apila piezas en un disco que gira sobre un pivote.",
    "en": "Stack pieces on a disc that tips on a pivot.",
    "pt": "Empilhe peças num disco que balança sobre um pivô."
  },
  "keywords": {
    "es": [
      "equilibrio",
      "balanza",
      "apilar"
    ],
    "en": [
      "balance",
      "scale",
      "stack"
    ],
    "pt": [
      "equilíbrio",
      "balança",
      "empilhar"
    ]
  },
  "players": {
    "min": 1,
    "max": 1
  },
  "duration": "1–5",
  "tipos": [
    "skill"
  ],
  "labs": true,
  "available": false,
  "modes": [
    "solo"
  ],
  "ai": false,
  "memory": "juegos-de-salon:wobbles-3d:session",
  "languages": [
    "es",
    "en",
    "pt"
  ],
  "firebasePaths": [],
  "canonExceptions": [
    {
      "canon": "C-2",
      "why": "A prototype the owner brought whole from another tool and asked to keep untouched in the lab (docs/games/wobbles-3d.md): one page with its code inline. It has no style.css, rules.js, engine.js or engine.test.mjs (texts in es/en/pt and physics live in the page's script, so no GAME_ID or LOCALES either), its screens are cards over a canvas, not .screen sections, and its own HUD carries the ‹ back to the lab instead of an a.back header."
    },
    {
      "canon": "C-3",
      "why": "A prototype the owner brought whole from another tool and asked to keep untouched in the lab (docs/games/wobbles-3d.md): one page with its code inline. Its texts in es/en/pt are the page's own TEXTS table, read with the site's lang key, not LOCALES in rules.js."
    },
    {
      "canon": "C-6",
      "why": "A prototype the owner brought whole from another tool and asked to keep untouched in the lab (docs/games/wobbles-3d.md): one page with its code inline. A round lasts a minute or two and is not resumed: no session.js store and no #resume-slot."
    },
    {
      "canon": "C-7",
      "why": "A prototype the owner brought whole from another tool and asked to keep untouched in the lab (docs/games/wobbles-3d.md): one page with its code inline. Solo with no sharing yet, so nothing goes through compartir.js, and its rounds send no trackStart/trackFinish (game.js counts only the visit)."
    },
    {
      "canon": "C-19",
      "why": "A prototype the owner brought whole from another tool and asked to keep untouched in the lab (docs/games/wobbles-3d.md): one page with its code inline. Its game-over card is its own (play again), not the exits from fin.js; they come when it leaves the prototype stage."
    },
    {
      "canon": "C-17",
      "why": "A prototype the owner brought whole from another tool and asked to keep untouched in the lab (docs/games/wobbles-3d.md): a full-screen canvas with its own cards, which does not load base.css, so its cover has no site footer; the ‹ in its HUD goes back to the lab."
    }
  ]
};
