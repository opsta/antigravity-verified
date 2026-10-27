---
name: verify
description: Verifies finished work against the active spec's acceptance criteria and writes VERIFY.md for human acceptance (Gate 3). Use before claiming a feature, fix or track is done.
---

# Verify

Run these steps in order. Do not skip any.

1. **Find the active spec.** With Conductor it is `conductor/tracks/<track_id>/spec.md` for the track in progress. Otherwise ask the human for the spec path. List its acceptance criteria and number them. Mark each as `[ui]` if the spec does.
2. **Run the contract.** Read the repo's `AGENTS.md` for a line `Contract: <cmd>`. If there is none, use `npm run verify:contract`. Run it and record the command and its exit code. If it fails, fix the cause (never the tests) or report it, then run it again.
3. **Call the `verifier` subagent.** Give it the spec path and the output of `git diff --stat <base>..HEAD`. It returns table rows only. Use the track's first commit parent as `<base>`, or ask the human.
4. **Optional: call `ui-checker`.** Only for criteria marked `[ui]`, at most 3. It returns rows with `artifact` evidence.
5. **Write `VERIFY.md`** at the repo root from `assets/VERIFY.template.md`. Fill the table with every row, then:
   - `Untested criteria`: every criterion with no evidence.
   - `Tests modified`: test files changed in the diff.
   - `Core files touched`: files in `CORE.lock` changed in the diff.
6. **Stop at Gate 3.** Tell the human `VERIFY.md` is ready and wait. Do not edit it to say accepted, and do not claim the work is done until they accept it.

Evidence kinds are `test`, `command` and `artifact`. A criterion without evidence is `fail`, never `pass`.
