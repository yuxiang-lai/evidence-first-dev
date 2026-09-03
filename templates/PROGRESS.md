# PROGRESS

- **Change**: {{CHANGE_ID}}
- **Ledger schema**: evidence-first-dev/change-ledger-v1
- **Mode**: {{MODE}}
- **Risk**: {{RISK}}
- **Phase**: S0
- **Status**: active
- **Current AC**: none
- **Doing**: Inspect repository state and record verified facts.
- **Next**: Complete alignment, scope, and executable acceptance criteria.
- **Blockers**: none
- **Last proven state**: Ledger initialized; no implementation evidence yet.

## Current task ledger

- [>] T01: Inspect repository and workflow rules -> facts written to CONTEXT.md

## Evidence log

| Date | Task/AC | Action or command | Result/exit code | Meaning |
| --- | --- | --- | --- | --- |

Use `scripts/run-evidence.mjs` for every check listed as `IC-*` in `REVIEW.md`.
It appends one row with `Task/AC`, the exact command, `exit <n>`, and one
machine evidence link such as `evidence/<generated-file>.json`. A generated row has
this exact shape:

```text
| 2026-09-03 | AC-01 | run-evidence: npm test | exit 0, success | exit 0, success; [machine evidence](evidence/<generated-file>.json) |
```

The result includes one `failureClass`: `success`, `non-zero-exit`, `timeout`,
`output-limit`, `spawn-failure`, or `signal`. Do not hand-write a PASS row,
invent an evidence filename, or run commands that print secrets. One row must
describe one subject only.

## Handoff note

- Current phase/task: S0 / T01
- Last proven state: Ledger initialized.
- Blocker: none
- Next action: Inspect the repository and update the ledger.
