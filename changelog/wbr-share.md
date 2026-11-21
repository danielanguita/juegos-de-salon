level: minor

- **📋 WBR: share it by link.** In the panel's WBR, **🔗 Share** freezes the week as it reads now and copies a link
  (`juegosdesalon.cl/wbr/?id=…`) to a light HTML page anyone can open without signing in: the same charts and
  tables, no PDF. Under the week's buttons the panel lists its shares, each with **Copy link** and **Stop sharing**,
  which turns the link off at once. Firebase: `wbrShared/<id>`, readable only by its id, written only by the owner.
