---
trigger: always_on
---

# Verification contract

Done means every acceptance criterion in the active spec has evidence. Evidence is one of:

- `test`: the test name and that it passes
- `command`: the command and its exit code
- `artifact`: the path of a screenshot or recording

A criterion with no evidence is not done. Say so; do not guess.

Never edit or delete a test to make it pass. If a test is wrong, stop and ask the human.

If `CORE.lock` exists, never edit the files it lists.

Stop and ask the human at three gates. Do not continue until they answer:

1. After you write or update the spec, stop: **Gate 1 spec approved**.
2. After you write the plan, stop: **Gate 2 plan approved**.
3. After you write `VERIFY.md`, stop: **Gate 3 VERIFY.md accepted**.

Before you claim the work is done, run the `/verify` skill. Only the human can pass Gate 3.
