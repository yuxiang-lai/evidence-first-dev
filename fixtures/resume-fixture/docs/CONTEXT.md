# PROJECT CONTEXT

This file is stable, project-wide memory for the resume fixture.

- **Schema**: evidence-first-dev/project-context-v1
- **Repository root**: resume-fixture
- **Product/service**: resumable fixture project
- **Current branch**: fixture
- **Runtime and package versions**: Node.js with npm
- **Last verified**: 2026-09-03

## Stable facts

| Fact | Source | Confidence | Last checked |
| --- | --- | --- | --- |
| The project has a runnable Node test command. | package.json | high | 2026-09-03 |

## Architecture and ownership

- Entry points: package.json scripts
- Ownership boundaries: test command and workflow ledger
- Persistence and external systems: none
- Relevant callers/consumers: fixture smoke test
- Trust or deployment boundaries: local fixture only

## Conventions

- Code: ES modules
- Tests: Node test runner
- UI and visual language: not applicable
- Errors, logging, and observability: command exit code
- Migrations, releases, and configuration: not applicable

## Verified commands

- Install/build: no install required
- Focused test: npm test
- Full test: npm test
- Lint/typecheck: not configured
- Run/inspect: npm test

## Change ledger policy

- One directory under `docs/changes/<id>/` per non-trivial change.
- `PROGRESS.md` is the only live status source for a change.
- Exactly one task may be active inside a change.
- Run the workflow index sync after meaningful state changes.
