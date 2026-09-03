# Ledger Templates

The initializer creates these files. Use the templates below when repairing a
ledger by hand. Keep headings stable so a later agent can resume quickly. Use
the user's language for prose when the repository has no stronger convention.

## Project memory files

The initializer also creates two project-level files:

- `docs/CONTEXT.md` is stable cross-change memory for repository identity,
  architecture, conventions, and verified commands.
- `docs/WORKFLOW.md` is the single recovery entry. Its generated status block
  is derived from each change's `PROGRESS.md` and `PRD.md` in machine index
  mode. In portable index mode, update it by hand and keep every unfinished
  change linked.

Version markers identify the project context, workflow contract, change ledger,
and command evidence formats. Missing markers may be repaired by
`init.mjs --resume` or `--upgrade`; incompatible markers require an explicit
migration and must be rejected rather than silently reinterpreted. See
`references/workflow.md` for upgrade rules.

The change-level `CONTEXT.md` is intentionally scoped to one change. It can
reference `docs/CONTEXT.md` instead of copying stable facts. `PROGRESS.md` is
the only authoritative live status source for its change.

## PRD.md

```md
# PRD: <change-id>

- **ID**: <change-id>
- **Ledger schema**: evidence-first-dev/change-ledger-v1
- **Evidence mode**: machine | portable
- **Type**: feature | bug | refactor | test | other
- **Mode**: Fast | Full
- **Risk**: low | high
- **Status**: active | blocked | done
- **Confirmation**: pending
- **Confirmation source**: <user message, issue, or explicit approval source>
- **Decision depth**: pending
- **Contract required**: pending

## Problem

### Observed facts
- Source/evidence:

### Hypothesis to test
-

### Goal
-

### Value hypothesis
- Beneficiary:
- Problem cost:
- Why now:
- Success signal:
- Expected effort/opportunity cost:
- Acceptable regression:
- Kill/stop condition:

### Scope
- In:
- Out:

## Minimum-change gate

- Build decision:
- Existing mechanism checked:
- Smallest correct diff:
- New files/dependencies/abstractions and why:
- Intentionally not built:

## First-principles model

- Actor and trigger:
- Observable outcome:
- Invariant:
- Ownership boundary:
- Trust boundaries:
- Failure cost:
- Reversibility:
- Simplicity ceiling and upgrade trigger:

## Acceptance

| ID | Given / When / Then | Verify | Expected | Status |
| --- | --- | --- | --- | --- |
| AC-01 | | | | pending |

## Options and decision

Use the table only when `Decision depth: compare`. For `minimal`, leave the
rows unused and record why a comparison adds no information.

| Option | Mechanism/surface | Value/effort | Correctness | Risk/reversibility | Testability | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| A | | | | | | |
| B | | | | | | |

Chosen option:
Why:
Rejected options:
Revisit when:
Why no comparison:

## Contract and failure behavior

Complete this section only when `Contract required: yes`; otherwise write
`N/A - private local surface` in the relevant record when a decision depends on
that fact.

- Inputs/outputs:
- Errors and validation:
- Timeout/retry/idempotency:
- Compatibility:
- Dependency failure:

## Data, rollback, and release

- Data change or `N/A - reason`:
- Migration:
- Rollback:
- Release/config concerns:

## Research references

- `RESEARCH.md`, source path, or official URL:

## UI

- **UI Required**: no
- Prototype: `N/A - no visible UI change`
- Prototype approval source:

## Debt and known limits

- none

## Scope change log

- <date>: initial scope
```

## CONTEXT.md

`docs/changes/<id>/CONTEXT.md` is scoped to one change. It should link to
project memory instead of copying unrelated facts.

```md
# CONTEXT

## Project identity

- Repository root:
- Product/service:
- Current branch:
- Runtime and package versions:

## Stable facts

| Fact | Source | Confidence | Last checked |
| --- | --- | --- | --- |
| | | high | |

## Domain terms

| Term | Meaning in this repository | Source |
| --- | --- | --- |
| | | |

## Architecture map

- Entry point:
- Ownership boundary:
- Persistence/external systems:
- Relevant callers/consumers:

## Conventions

- Code:
- Tests:
- UI:
- Errors/logging:
- Migrations/release:

## Verified commands

- Install/build:
- Focused test:
- Full test:
- Lint/typecheck:
- Run/inspect:

## Handoff snapshot

- Last proven state:
- Current assumption:
- Next evidence to collect:
```

## WORKFLOW.md

`docs/WORKFLOW.md` is a bounded recovery index: it contains all active or
blocked changes and only the ten most recent completed changes. It is not a
second history ledger.

```md
# WORKFLOW

This is the project's single recovery entry for non-trivial development.

- **Workflow contract**: evidence-first-dev/workflow-v1
- **Index mode**: machine | portable

## New-session protocol

1. Read this file. If Node.js is available, optionally run
   `node <skill>/scripts/index.mjs resume <project-root>` first.
2. Choose the one change to continue. If it reports
   `NEEDS-CHOICE`, do not silently select between unfinished changes.
3. Read that change's `PROGRESS.md` first, then its `PRD.md`, `CONTEXT.md`,
   `DECISIONS.md`, `PLAN.md`, and relevant evidence or review.
4. Inspect repository status and recheck the last proven command before
   continuing from the first incomplete task.

<!-- BEGIN GENERATED STATUS -->
<!-- END GENERATED STATUS -->
```

## PROJECT-CONTEXT.md

`docs/CONTEXT.md` is bounded current-state memory. Update facts in place, do
not append chat transcripts, and keep only the latest five meaningful
project-wide updates. Historical details belong to the relevant change ledger.

```md
# PROJECT CONTEXT

This file is stable, project-wide memory. It is not a task status board.

- **Schema**: evidence-first-dev/project-context-v1
- **Repository root**:
- **Product/service**:
- **Current branch**:
- **Runtime and package versions**:
- **Last verified**:

## Stable facts

| Fact | Source | Confidence | Last checked |
| --- | --- | --- | --- |
| | | high | |

## Architecture and ownership

- Entry points:
- Ownership boundaries:
- Persistence and external systems:
- Relevant callers/consumers:
- Trust or deployment boundaries:

## Conventions

- Code:
- Tests:
- UI and visual language:
- Errors, logging, and observability:
- Migrations, releases, and configuration:

## Verified commands

- Install/build:
- Focused test:
- Full test:
- Lint/typecheck:
- Run/inspect:

## Change ledger policy

- One directory under `docs/changes/<id>/` per non-trivial change.
- `PROGRESS.md` is the only live status source for a change.
- Exactly one task may be active inside a change.
- Run the workflow index sync after changing phase, status, current task,
  blocker, next action, or last proven state.
```

## DECISIONS.md

```md
# DECISIONS

Append one record per material choice. Never silently rewrite a decision.

## D-001 <short title>

- Date:
- Question:
- Options considered:
- Chosen:
- Reason tied to constraints/evidence:
- Rejected:
- Consequence:
- Revisit when:
- Confirmation source:
```

## PLAN.md

```md
# PLAN

## Outcome

- Change:
- Acceptance covered:

## Task tree

| ID | Task | Depends | Output | Verify | Stop if | Risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | | - | | | | low | queued |

## Execution rule

Exactly one task is active in `PROGRESS.md`. Complete it with evidence before
activating the next task. Append discovered tasks at the end.

The `Stop if` field is mandatory for S5+ tasks. Use it to stop speculative
implementation when the task's assumption or reproduction is not proven.

## Rollback/stop conditions

-
```

## PROGRESS.md

```md
# PROGRESS

- **Change**: <change-id>
- **Ledger schema**: evidence-first-dev/change-ledger-v1
- **Evidence mode**: machine | portable
- **Mode**: Fast | Full
- **Risk**: low | high
- **Phase**: S0 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8
- **Status**: active | blocked | done
- **Current AC**: AC-01 | none
- **Doing**:
- **Next**:
- **Blockers**: none
- **Last proven state**:

## Current task ledger

- [>] T01: <action> -> <verifiable output>
- [ ] T02: <action> -> <verifiable output>

## Evidence log

| Date | Task/AC | Action or command | Result/exit code | Meaning |
| --- | --- | --- | --- | --- |
| | | | | |

In machine mode, use `scripts/run-evidence.mjs` for every check listed as
`IC-*` in `REVIEW.md`. It appends one row with `Task/AC`, the exact command,
`exit <n>`, and one `[machine evidence](evidence/<generated-file>.json)` link. It stores
machine-captured command evidence under `evidence/` and records a bounded
preview plus hashes in the ledger. The generated row is:

```text
| 2026-09-03 | AC-01 | run-evidence: npm test | exit 0, success | exit 0, success; [machine evidence](evidence/<generated-file>.json) |
```

Its `failureClass` is one of `success`, `non-zero-exit`, `timeout`,
`output-limit`, `spawn-failure`, or `signal`. Do not hand-write a PASS row,
invent an evidence filename, or run commands that print secrets. One row must
describe one subject only. In portable mode, create one `evidence/<subject>.md`
file from `templates/EVIDENCE.md`, use `Producer: manual-observed`, and link it
as `[manual evidence](evidence/<subject>.md)`.

## Handoff note

- Current phase/task:
- Last proven state:
- Blocker:
- Next action:
```

## REVIEW.md

```md
# REVIEW

- **Status**: draft | final
- **Reviewer**: agent plus fresh-context pass

## Acceptance axis

- AC-01: PASS - Command: `<exact command>` | Result: exit 0 | Evidence: [machine evidence](evidence/<generated-file>.json)

List every AC on its own line using exactly `Command`, `Result`, and `Evidence`.
The required shape is:

```text
- AC-01: PASS - Command: npm test | Result: exit 0 | Evidence: [machine evidence](evidence/<generated-file>.json)
```

In machine mode, the link must point to a v3 record produced by
`run-evidence.mjs` for the same AC and must have `exitCode: 0` and
`failureClass: success`. In portable mode, it may point to a valid manual
evidence file for the same AC. A summary line alone is not acceptance evidence.

## Important checks

- none
- Format: `IC-01: AC-01 or T01 | Command: <exact command> | evidence required`
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
```

## RESEARCH.md

```md
# RESEARCH

## R-001 <question>

- Question:
- Local version/context:
- Source (URL or path):
- Retrieved/checked:
- Relevant excerpt or observed behavior:
- Conclusion:
- Remaining uncertainty:
```

## PROTOTYPE.md

```md
# PROTOTYPE

- **Status**: draft | approved | rejected | not-required
- **Path**:
- **Prototype approval source**:

## User outcome and states

- Primary flow:
- Loading:
- Empty:
- Error/retry:
- Success:
- Disabled/permission:
- Responsive states:

## Existing project references

- Route/page:
- Components:
- Tokens/styles:
- Screenshot/running page:

## Options

| Option | Reuses project language | Interaction fit | Cost/risk | Decision |
| --- | --- | --- | --- | --- |
| A | | | | |
| B | | | | |

## Approval notes

- What was confirmed:
- What remains open:
```

## PR.md

```md
# PR: <change-id>

## Summary

- Problem/outcome:
- Chosen design:

## Scope

- Changed:
- Not changed:

## Implementation

- Files and reason:
- Important tradeoffs:

## Verification

- Standards: <actual command -> result>
- Acceptance:
  - AC-01: <actual command -> result>

## Risk and rollback

- Residual risk:
- Rollback:

## Review

- `REVIEW.md` status:
- Fresh-context result:
```
