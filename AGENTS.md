# Evidence-First Development

Use the full workflow in `SKILL.md` when this repository is available. This
file is also a standalone bridge for tools that load `AGENTS.md` but do not
support directory-based skills.

For non-trivial coding changes:

- Read the repository's instructions and `docs/WORKFLOW.md` before deciding.
- Treat the user's proposed solution as a hypothesis; identify the actor,
  observable outcome, invariant, constraints, failure cost, and simplest
  existing mechanism first.
- Match the process to risk: keep tiny reversible edits light; use a change
  ledger for multi-step or resumable work; use the full gates for data,
  permissions, public contracts, cross-service, production-critical, or
  materially uncertain work.
- For bugs, reproduce first and fix the shared root cause. For new behavior,
  prefer a failing test before implementation when the project supports it.
- For UI changes, inspect the existing visual language, make a matching
  prototype, and obtain approval before production UI code.
- When real alternatives have different value, cost, risk, or reversibility,
  show a concise comparison and record the decision. Do not invent options.
- Keep exactly one active task. Each task has one output, one verification,
  and one stop condition. A failed check, unstable reproduction, unproven
  assumption, or missing approval is a blocker, not a reason to stack patches.
- Do not mark work complete without an observable result and evidence. Record
  commands, exit codes, or honest manual observations in the repository.
- Before finishing, update the change record and `docs/WORKFLOW.md` so a new
  session can resume without this conversation.

The complete rules, templates, portable Markdown procedure, and optional
automation are in the Evidence-First Dev repository:
https://github.com/yuxiang-lai/evidence-first-dev

This bridge is intentionally compact. Do not create a second independent
workflow or silently require Node.js, Python, or the target project's runtime.
