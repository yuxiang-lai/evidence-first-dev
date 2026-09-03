# Fixture Repositories

These are small, dependency-free repositories for exercising the workflow
against project-shaped source, tests, UI conventions, and public contracts.
They are intentionally tiny. Their purpose is to test workflow decisions and
command boundaries, not to act as production examples.

| Fixture | Surface | Baseline command |
| --- | --- | --- |
| `bug-fixture` | Duplicate write on retry and regression reproduction | `npm test`; `npm run reproduce` is expected to fail |
| `ui-fixture` | Existing tokens, components, responsive settings page | `npm test` |
| `contract-fixture` | Public response shape and OpenAPI-like contract | `npm test` |
| `resume-fixture` | Existing project memory and an interrupted-work starting point | created and resumed by `scripts/fixture-smoke.test.mjs` |

Run the smoke test from the skill directory:

```text
node scripts/fixture-smoke.test.mjs
```

The fixture smoke test copies each repository into a temporary directory, so it
does not write ledger state into this skill or change the fixture baseline.
