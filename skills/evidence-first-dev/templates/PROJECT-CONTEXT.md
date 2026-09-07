# PROJECT CONTEXT

This file is stable, project-wide memory. It is not a task status board.
Update it when repository facts, conventions, commands, or ownership boundaries
change. Keep transient work state in `docs/WORKFLOW.md` and the change ledger.

- **Schema**: evidence-first-dev/project-context-v1
- **Repository root**: {{PROJECT_ROOT}}
- **Product/service**:
- **Current branch**:
- **Runtime and package versions**:
- **Last verified**: {{DATE}}

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

## Domain terms

| Term | Meaning in this repository | Source |
| --- | --- | --- |
| | | |

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

## Retention and compaction

- Keep this file as current-state memory, not a session diary.
- Update an existing fact when it changes; do not append a second row for the
  same fact just to preserve an old value.
- Keep `Update history` to the latest five meaningful project-wide changes.
  Move older history to an explicitly named archive such as
  `docs/archive/PROJECT-CONTEXT-history.md` only when it is needed. Never move
  an active or blocked change.
- Keep change-specific facts, experiments, and historical rationale in the
  change ledger instead of copying them here.

## Stable project decisions

Append durable repository-wide decisions here only when they apply to more than
one change. Keep decisions limited to one change in that change's
`DECISIONS.md`.

## Update history

| Date | Change | Update | Evidence/source |
| --- | --- | --- | --- |
| {{DATE}} | initialization | Created project memory entry | evidence-first-dev initializer |
