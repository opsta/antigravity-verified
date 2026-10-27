# verified

A small Antigravity plugin that adds a **verify** step, with human gates, after a spec-driven build.
It is Markdown only: one rule, one skill and two subagents. No dependencies.

## What it adds after Conductor

Conductor takes you from a spec to a plan to an implementation. `verified` adds the last part:
a check that the finished work meets every acceptance criterion, with evidence, signed off by a person.

- `rules/verification-contract.md`: always on. Done means every acceptance criterion has evidence.
  Tests are never edited to pass. Files in `CORE.lock` are never edited.
- `skills/verify`: the `/verify` skill. Runs the contract command, calls the subagents, writes `VERIFY.md`.
- `agents/verifier.md`: an independent, read-only checker with a fresh context.
- `agents/ui-checker.md`: optional. Walks through up to 3 `[ui]` criteria in a browser and saves screenshots.

## Install

```
agy plugin install https://github.com/<opsta-org>/verified
```

Or from a local folder: `agy plugin install ./verified`. Check with `agy plugin list`.

## The three gates

The agent stops and waits for a person at each of these:

1. **Gate 1 spec approved**
2. **Gate 2 plan approved**
3. **Gate 3 VERIFY.md accepted**

Gates 1 and 2 come from your spec and plan tool (for example Conductor). Gate 3 belongs to this plugin.
Only the human can pass it.

## Contract command

`/verify` runs the command on the line `Contract: <cmd>` in your repo's `AGENTS.md`.
If there is no such line it runs `npm run verify:contract`.

## VERIFY.md example

```
# VERIFY

Spec: conductor/tracks/ask-question/spec.md
Contract: npm run verify:contract (exit 0)

| # | Acceptance criterion | Evidence kind | Evidence | Result |
|---|---|---|---|---|
| 1 | A user can post a question of up to 280 characters | test | accepts 280 chars, rejects 281 | pass |
| 2 | Contract checks pass | command | npm run verify:contract, exit 0 | pass |
| 3 | The question list shows the new question [ui] | artifact | artifacts/question-list.png | pass |

## Untested criteria

none

## Tests modified

none

## Core files touched

none

Gate 3: awaiting human acceptance
```

## Token budget

The files are small on purpose, because every subagent may re-read the rule.
Rule at most 1,536 bytes, each skill at most 3,072 bytes, each agent at most 2,400 bytes.
Aim for no more than 25k tokens per verify run. `node scripts/check.mjs` enforces the byte limits.

## Development

```
node --test && node scripts/check.mjs
agy plugin validate . --strict
```

## Licence

Apache-2.0. See `LICENSE`.
