# WORKFLOW

This is the project's single recovery entry for non-trivial development.

- **Workflow contract**: evidence-first-dev/workflow-v1

## New-session protocol

1. Run `node <skill>/scripts/index.mjs resume <project-root>`.
2. Read this file and choose the one change to continue. If it reports
   `NEEDS-CHOICE`, do not silently select between unfinished changes.
3. Read that change's `PROGRESS.md` first, then its `PRD.md`, `CONTEXT.md`,
   `DECISIONS.md`, `PLAN.md`, and relevant evidence or review.
4. Inspect the repository status and recheck the last proven command before
   continuing from the first incomplete task.

## Memory ownership

- `docs/CONTEXT.md` is stable project memory: architecture, conventions,
  commands, and facts that apply across changes.
- `docs/changes/<id>/CONTEXT.md` is scoped change memory: relevant facts,
  constraints, and observations for one change. Link to the project context
  instead of copying unrelated facts.
- `docs/changes/<id>/PROGRESS.md` is the authoritative live state for that
  change.
- The generated section below is a routing index, not a second ledger. Run
  `node <skill>/scripts/index.mjs sync <project-root>` after meaningful state
  changes; never edit the generated section by hand.

## Project commands and conventions

Maintain stable project-wide commands and conventions in `docs/CONTEXT.md`.
Keep change-specific commands and evidence in the corresponding change
ledger.

<!-- BEGIN GENERATED STATUS -->
<!-- END GENERATED STATUS -->
