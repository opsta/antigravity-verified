---
name: verify
description: Verifies finished work against the active spec's acceptance criteria and writes VERIFY.md for human acceptance (Gate 3). Use before claiming a feature, fix or track is done.
---

# Verify

Run these steps in order. Do not skip any. You run every command; subagents run none.
Run each command on its own: no `&&`, `;` or pipes.

1. **Find the active spec.** With Conductor it is `conductor/tracks/<track_id>/spec.md` for the track in progress. Otherwise ask the human. Number its acceptance criteria; keep `[ui]` marks.
2. **Run the contract.** Use the `Contract: <cmd>` line in `AGENTS.md`, else `npm run verify:contract`. Record the command and exit code. If it fails you may fix non-test code and rerun, at most 2 times. Never edit tests or files in `CORE.lock`.
3. **Collect evidence.** Run and keep the output of:
   - the tests with one line per test, e.g. `npx vitest run --reporter=verbose`
   - `git diff --stat <base>`: `<base>` is `@{upstream}`, or the parent of the track's first commit
   - `git status --short`
4. **Call the `verifier` subagent.** Pass the spec path, the contract command and exit code, and the full output of step 3. It returns rows. Do not rerun anything it asks for; it must work from what you gave it.
5. **Optional: `ui-checker`.** Only if the human gave an app URL and a browser is available; at most 3 `[ui]` criteria.
6. **Write `VERIFY.md`** at the repo root. Do not search for a template; use this layout:

```
# VERIFY

Spec: <path>
Contract: <cmd> (exit <code>)

| # | Acceptance criterion | Evidence kind | Evidence | Result |
|---|---|---|---|---|

## Untested criteria
## Tests modified
## Core files touched

Gate 3: awaiting human acceptance
```

   - One row per criterion. Result is `pass`, `fail` (evidence shows it does not work) or `not evidenced: <why>`.
   - `Untested criteria`: every `not evidenced` row, or `none`.
   - `Tests modified`: test files in the diff or status, or `none`.
   - `Core files touched`: files in `CORE.lock`, `CORE.lock` itself, `package.json`, lockfiles, vite/vitest/tsconfig and `.github/workflows/*` in the diff or status, or `none`.
7. **Stop at Gate 3.** Tell the human `VERIFY.md` is ready and wait. Do not mark it accepted or claim done until they accept.

Evidence kinds: `test` (name, seen passing in step 3), `command` (command + exit code), `artifact` (file path). Never write `pass` without evidence.
