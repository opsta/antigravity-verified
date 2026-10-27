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

Stop and ask the human at three gates, and do not continue until they answer:

1. Gate 1 spec approved
2. Gate 2 plan approved
3. Gate 3 VERIFY.md accepted

Before you claim the work is done, run the `/verify` skill. Only the human can pass Gate 3.
