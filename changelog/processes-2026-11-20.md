level: patch

- Workshop: the push guard really stops a push now. Its hook command ended in `|| true`, which turned the guard's "stop" (exit 2) into "go on", so since November 9 it never blocked anything and the design-lint gate went red on three PRs it should have caught (#1582, #1667, #1699). `push-guard.test.mjs` now runs every blocking hook's command and fails if the 2 does not get through.
