# REVIEW

- **Status**: draft
- **Reviewer**: agent plus fresh-context pass

## Acceptance axis

- AC-01: PASS - Command: `<exact command>` | Result: exit 0 | Evidence: [machine evidence](evidence/<generated-file>.json)

List every AC on its own line using exactly `Command`, `Result`, and `Evidence`.
In `portable` mode, use `[manual evidence](evidence/<id>.md)` and link the
corresponding file. A summary line alone is not acceptance evidence.

## Important checks

- none
- Format: `IC-01: AC-01 or T01 | <important command>; evidence required`
- Each `IC-*` subject must have successful evidence in the selected Evidence
  mode before the change can be marked `done`.

## Standards axis

- Tests:
- Types/build:
- Lint/format:
- Security/permissions:
- Accessibility/UI:

## Adversarial checks

- Relevant edge cases and result:
- Irrelevant categories and reason:

## Diff and scope

- Intended files:
- Accidental files:
- Out of scope changes removed:

## Residual risk and debt

- none

## Fresh-context result

- Can a new agent understand the goal, choice, next step, and evidence from
  files alone?
-

## Follow-up rules

-

## Completion summary

- Standards: PASS|FAIL|SKIP - <actual commands -> result>
- Acceptance: PASS|FAIL|SKIP - <all AC lines above have individual evidence>
