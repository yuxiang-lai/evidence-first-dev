# PROGRESS

- **Change**: {{CHANGE_ID}}
- **Ledger schema**: evidence-first-dev/change-ledger-v1
- **Mode**: {{MODE}}
- **Risk**: {{RISK}}
- **Evidence mode**: machine
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

In `machine` mode, use `scripts/run-evidence.mjs` for every check listed as
`IC-*` in `REVIEW.md`. In `portable` mode, run the project command normally and
write one `evidence/<id>.md` file from `templates/EVIDENCE.md` for each task or
AC, then link it using the `[manual evidence]` label. A machine-generated
row has this shape:

```text
| 2026-09-03 | AC-01 | run-evidence: npm test | exit 0, success | exit 0, success; [machine evidence](evidence/<generated-file>.json) |
```

The result includes one `failureClass`: `success`, `non-zero-exit`, `timeout`,
`output-limit`, `spawn-failure`, or `signal`. Do not hand-write a PASS row,
invent an evidence filename, or run commands that print secrets. In portable
mode, a manual row must identify the command, observed time, exit code,
failure class, observation, and the limitation that it was not machine captured.
One row must describe one subject only.

## Handoff note

- Current phase/task: S0 / T01
- Last proven state: Ledger initialized.
- Blocker: none
- Next action: Inspect the repository and update the ledger.
