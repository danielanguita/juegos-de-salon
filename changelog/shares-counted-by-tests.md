level: patch

- **Shares counted right in the panel**: the home page's "shared" number was mostly our own tests. `compartir.test.mjs`, run in Node with no web page, counted five home-page shares in the live numbers on every run, locally and in CI (hundreds a day since D-349). A share now counts only on a web page and never from a robot; a test fails if sharing in a test writes to the database. The days already counted are left as they are.
