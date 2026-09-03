# WORKFLOW

This is the project's single recovery entry for non-trivial development.

- **Workflow contract**: evidence-first-dev/workflow-v1
- **Index mode**: machine

## New-session protocol

1. Read this file first. If Node.js is available, optionally run
   `node <skill>/scripts/index.mjs resume <project-root>` to refresh it.
2. Choose the one change to continue. If the index contains multiple unfinished
   changes, report `NEEDS-CHOICE` and do not silently select one.
3. If the index reports `NEEDS-CHOICE`, do not silently select between
   unfinished changes.
4. Read that change's `PROGRESS.md` first, then its `PRD.md`, `CONTEXT.md`,
   `DECISIONS.md`, `PLAN.md`, and relevant evidence or review.
5. Inspect the repository status and recheck the last proven command before
   continuing from the first incomplete task.

## Memory ownership

- `docs/CONTEXT.md` is stable project memory: architecture, conventions,
  commands, and facts that apply across changes.
- `docs/changes/<id>/CONTEXT.md` is scoped change memory: relevant facts,
  constraints, and observations for one change. Link to the project context
  instead of copying unrelated facts.
- `docs/changes/<id>/PROGRESS.md` is the authoritative live state for that
  change.
- The status section below is a routing index, not a second ledger. In
  `portable` mode, update it by hand after meaningful state changes and keep a
  link to every active or blocked `PROGRESS.md`. In `machine` mode, run
  `node <skill>/scripts/index.mjs sync <project-root>` and never edit it by hand.

## Project commands and conventions

Maintain stable project-wide commands and conventions in `docs/CONTEXT.md`.
Keep change-specific commands and evidence in the corresponding change
ledger.

<!-- BEGIN GENERATED STATUS -->
## Current Change Status

Unfinished changes: **0** | Active: **0** | Blocked: **0**

No active or blocked changes. In portable mode, add one entry per unfinished
change with its ID, status, phase, current task, next action, blocker, last
proven state, and `docs/changes/<id>/PROGRESS.md` path.
<!-- END GENERATED STATUS -->
