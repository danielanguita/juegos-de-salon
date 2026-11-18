level: minor

- **In the lab: the home page as carousels** (flag `home-carousels`, `/labs/` 🎠, the owner's design). With the
  flag on, the filters, the search and the long list give way to rows that slide sideways under La Copa and Uno al
  día: Favoritos (once one is marked), Populares, Nuevos, Con amigos, Rápidos and one per type. A game shows its
  icon, its name and how long it takes; a tap opens a sheet with its details, its ranking, the ⭐ and ▶ Jugar.
  Players see no change until the owner launches it. The tests hold the flag off (`tools/e2e/flags-held.json`),
  so the scripts that open the home page keep testing what players see; `home/carousels.mjs` tests the new one.
