# Piece 7 · The retention loop

Part of the [learning programme](../LEARNING.md) (D-532). Read that file first.

## Goal

**Players come back more often, and the factory notices on its own when they stop.** Today the
Sunday report already counts who comes back to «Uno al día» the next day (`d1`) and after a week
(`d7`), but nobody acts on those numbers: a drop is seen, if at all, by the owner reading a PDF.
This piece turns those numbers into a weekly loop:

1. **Notice**: an agent reads the return numbers every week, game by game, and finds the drop that
   matters (the biggest, the one that keeps going), not every wobble.
2. **Explain**: it proposes *why* players stopped, with the evidence it has (a release that week, a
   game that got harder, a broken streak, a 🐞 report), as a falsifiable hypothesis.
3. **Act, with the owner's Yes**: it proposes one action that could bring them back (a splash
   campaign, a push, a change behind a lab flag) as a one-tap decision. The owner approves it; the
   factory runs it through the systems that exist (CAMPAIGNS and the panel's 📣, the lab flags).
4. **Learn**: two weeks later it reads the same number again and writes the verdict: it worked, it
   did not, or the sample was too small to say. The verdict goes into the ledger the hypothesis
   loop (piece 5) needs, so this piece is also how piece 5 gets its first real experiments.

What it wants to achieve, in one sentence: **every week the owner gets at most one well-argued
proposal to bring players back, and every approved proposal ends with a number that says whether
it worked.**

## Why

- **For the app**: retention is the lever closest to engagement. A game people try once and forget
  is cost; a game they come back to is the product. Return numbers are small and noisy here, so a
  person glancing at them weekly will over-react to noise or miss a slow slide. A loop with fixed
  rules does neither.
- **For the owner**: this is the product manager's core job (notice, hypothesise, act, measure)
  done by an agent under the owner's rules, the same way a PM would run a retention review with a
  team. Learning *which part* of that job an agent can own, and which it cannot, is the lesson.

## The number

**Next-day return of «Uno al día» (`d1`)**, four-week moving average, as the Sunday report computes
it. Secondary: `d7`, and the share of streaks of 3+ days broken in the week. The piece succeeds if,
within three months, at least one approved action moved `d1` beyond the noise band (below), and the
owner says the weekly proposal was worth reading.

## Concept (for the owner)

**What "a drop that matters" means.** The weekly numbers are small (tens of players), so a week up
or down by a few points is noise. The agent uses a **noise band**: the spread of the last eight
weeks of the metric (their standard deviation). A drop counts when this week is below the band's
floor *two weeks in a row*, or one week by twice the band. Anything else is reported as "within
noise" and nothing is proposed. This keeps the loop from crying wolf, which is how the owner learns
to ignore it.

**What a proposal looks like.** One issue through `processes.mjs decide`, with:

- *What dropped*: the metric, the game, the weeks, the band.
- *Why, maybe*: one hypothesis, falsifiable ("players who lose their streak on day 3 do not come back;
  a 🧊 freeze offered at the break brings back X%"), with the evidence (the release, the 🐞, the panel
  numbers).
- *The action*: one, already shaped for the system that runs it (a campaign entry for CAMPAIGNS, a
  push text, or a lab flag a session would build), with its cost.
- *The verdict date*: two weeks after it ships, and what number would say it worked.
- `origin`: "retention agent, from the week of <date>".

**What it never does on its own.** Everything a player sees goes through the owner (the owner's
rules: every splash is in CAMPAIGNS and the owner sees it before it goes live; pushes are 🔴; new
things sit behind the lab). The agent writes proposals and verdicts; it never ships an action.

## Autonomy: what the agent may do alone, and what it may not

This section is the agent's contract. A session building it copies it into its guide
(`.claude/agents/retention.md`).

| | Alone | Only with the owner's Yes | Never |
|---|---|---|---|
| Read | Firebase stats through the report's functions (`weekly-data.mjs`), the panel's numbers, GitHub, `changelog/`, 🐞 issues | | Player identities: it works on counts, never on a named player |
| Write in the repo | Its ledger `docs/retention.json` (weeks read, drops found, proposals, verdicts), in its own PR with auto-merge | | Game code, texts, CAMPAIGNS, flags |
| Talk to the owner | One proposal a week at most, as a one-tap decision; verdicts in the processes round's report | | Email or push the owner outside those channels |
| Act on players | | A campaign or push (built by a session after the Yes, through CAMPAIGNS / the panel's 📣, the owner sees it before it goes live); a change behind a lab flag | Send a push, start a campaign, flip a flag, or contact a player |
| Spend | Its weekly run on the owner's plan (Opus, low effort, D-582); no model in any player path (D-532) | | Any cost per player or per request |

**Its own stop rules** (so it never needs supervision to stay quiet):

- Within noise → it writes the week in its ledger and proposes nothing.
- A proposal still unanswered → it proposes nothing new (as the ideas agent does, D-440), only the
  verdict of what already shipped.
- Two proposals in a row declined → it says so in its next report and waits a week before proposing
  again; three in a row → it asks the owner whether its band or its kind of proposals is wrong.
- Fewer than 20 players in the metric that week → "too few to read", no proposal.

**How it is dispatched.** Weekly, by the processes round (`processes.mjs check`, like ci-health and
backlog), on Mondays, after the Sunday report has the closed week. The processes agent reviews what
it delivered with these criteria: the ledger advanced one week, any proposal follows the template
above, no proposal while one waits, and every verdict date reached has a verdict.

## Plan

| Step | Kind | What | Done when |
|---|---|---|---|
| 7.1 | concept ⚖️ | This page; the owner agrees with the goal, the number, the noise band and the autonomy table | The owner's answers recorded here |
| 7.2 | build | `tools/agents/retention.mjs check | record | verdict` (plain script and its test) reading the closed weeks through `weekly-data.mjs`; `docs/retention.json`; the band computed over eight weeks, back-filled from the archive so the first run has history | `check` prints the last eight weeks per metric with the band, and says "within noise" or names a drop |
| 7.3 | build | `.claude/agents/retention.md` (its guide is the autonomy section above), its dispatch in `processes.mjs` (weekly), its line in `docs/AGENTS.md` | A processes round dispatches it and its ledger advances |
| 7.4 | build | Verdicts: two weeks after an approved action ships, `verdict` compares the metric with the band and writes it to `docs/retention.json` and, once piece 5 exists, to its ledger | The first verdict is written |
| 7.5 | learnings | After three months: which proposals the owner approved, which worked, what the agent could not see | Learnings written |

**How this mechanism is removed**: if three months pass with no proposal approved, or no approved
action moves the number beyond noise, the agent is removed and its ledger kept as the record of why.

## Status

- 2026-11-17 · Concept written at the owner's request ("explica bien qué quieres lograr y documenta lo
  necesario para su autonomía"). Waiting on 7.1: the owner's agreement.

## The owner's decision (7.1)

1. Is `d1` of «Uno al día» the right headline number, or should it be return to *any* game?
2. Is the noise band (eight weeks, two weeks below or one week twice below) the right sensitivity?
3. Is the autonomy table right, in particular: proposals only, never acting on players?

## Learnings

*(written with the owner when a step ends)*
