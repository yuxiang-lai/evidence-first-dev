# Contributing

Thanks for helping improve Evidence-First Dev. Contributions should make the
workflow more reliable, more proportional, or easier to resume without adding
rules that do not protect a real risk.

## Before Opening A Change

- Read `SKILL.md` and the relevant file under `references/`.
- State the observable problem and the smallest useful outcome.
- Check whether an existing rule or script already covers the behavior.
- Keep new instructions scoped to the decisions they improve.

## Implementation Rules

- Preserve the `Micro` / `Fast` / `Full` process boundary.
- Prefer machine-enforced invariants over repeated prose when a rule is a real
  completion gate.
- Keep evidence schemas, templates, and validators synchronized.
- If a required field, status meaning, evidence interpretation, or validator
  gate changes, bump the relevant schema and add an explicit migration note.
- Do not add dependencies when the Node.js standard library is sufficient.
- Do not include real credentials, private paths, generated output, or project
  data in fixtures and examples.

## Verification

Run these commands from the repository root:

```text
node scripts/validate.test.mjs
node scripts/validate.done.test.mjs
node scripts/run-evidence.test.mjs
node scripts/fixture-smoke.test.mjs
python <path-to-skill-creator>/scripts/quick_validate.py .
```

When changing a validator rule or evidence schema, add or update a focused
observable test. When changing workflow behavior, update the behavioral matrix
in `references/evals.md`.

## Pull Requests

Describe the problem, the design choice, the files changed, and the commands
that passed. Keep unrelated cleanup out of the same change. If behavior is
intentionally deferred, document the capability ceiling and the observation
that would justify revisiting it.
