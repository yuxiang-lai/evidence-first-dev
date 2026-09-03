# Evidence-First Development

For any non-trivial coding change, read and follow the canonical workflow at
the first path that exists:

- `.ai/evidence-first-dev/SKILL.md`
- `.cursor/evidence-first-dev/SKILL.md` (legacy installation path)
- `SKILL.md` when this repository itself is the opened skill checkout

If no canonical file is available, use the portable minimum below and do not
silently invent a different workflow.

Keep the process proportional:

- Skip the full ledger for read-only explanations, prose-only edits, and tiny
  reversible changes.
- For real changes, use first-principles problem reduction, evidence-backed
  decisions, TDD or reproduction-first debugging, one active task, and the
  repository memory under `docs/`.
- For UI changes, inspect the existing visual language and obtain prototype
  approval before production UI implementation.
- Do not mark work complete from a plan, summary, or unverified command claim.

This file is only a bridge. The root `SKILL.md` is the detailed source of truth;
do not duplicate or independently edit the workflow in this file. If the skill
is stored elsewhere, add that path as the first existing canonical path rather
than rewriting the workflow.
