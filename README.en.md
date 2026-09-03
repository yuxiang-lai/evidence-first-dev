# Evidence-First Dev

> A first-principles, repository-as-memory, evidence-first, resumable workflow for coding agents.

[中文](README.md) | English

Evidence-First Dev is not a process that makes AI write more documents. It
helps an agent understand the real problem before coding, control complexity
while coding, prove the result with actual evidence, and continue work after a
new session or a tool change.

The workflow is plain Markdown and does not require Node.js, Python, or the
language used by the target project. Optional Node.js 18+ scripts automate
initialization, recovery-index synchronization, structural validation, and
machine evidence capture. The same protocol can be connected to Codex, Cursor,
Claude Code, Windsurf, Cline, Roo Code, GitHub Copilot, Gemini CLI, and Aider.

## Core Ideas

The goal is not to make AI blindly obedient. It should behave like an engineer
who reasons from evidence, checks its assumptions, and leaves a usable handoff.

### 1. Repository as memory

Project facts, conventions, decisions, current progress, blockers, and next
actions are written back to the repository.

- `docs/CONTEXT.md`: stable project facts and conventions
- `docs/WORKFLOW.md`: the single recovery entry for a new session
- `docs/changes/<id>/PROGRESS.md`: authoritative live state for one change
- `evidence/`: command or observation records

This prevents context loss, repeated analysis, and uncertainty about where the
previous session stopped.

### 2. First-principles reasoning

"Add a cache", "refactor this", or "build a page" is a proposed solution, not
automatically the real requirement. The agent identifies the actor, observable
outcome, invariant, constraints, failure cost, and simplest mechanism first.

This prevents an incorrect user proposal from becoming a larger and more
expensive implementation.

### 3. Evidence before completion

"It should be fixed" and "tests passed" are not proof. Assisted mode captures
important commands with `run-evidence.mjs`. Portable mode records a fixed-format
`manual-observed` Markdown file. Every mode requires evidence before a change
can be marked complete.

This makes conclusions reviewable instead of relying on an agent's summary.

### 4. Minimum correct change

Check existing code, components, platform facilities, and dependencies before
adding anything. Keep the smallest reversible change that fixes the shared
cause, and state what is intentionally deferred and when it should be revisited.

This reduces patch stacking, unnecessary abstractions, broad refactors, and
dependency growth.

### 5. TDD and reproduction-first debugging

For new behavior, write the smallest failing test before implementation when
the project can support it. For bugs, reproduce first, list falsifiable root
cause hypotheses, change one variable at a time, and add a regression test over
the original failure path.

This replaces guess-driven edits with a controlled feedback loop.

### 6. Prototype UI before production UI

For visible changes, inspect the project's existing components, tokens, fonts,
spacing, responsive rules, and interaction states. Create a prototype using
that visual language and obtain explicit approval before writing production UI.

This prevents style drift, missing states, and expensive visual rework.

### 7. Compare real alternatives

When options have materially different value, cost, risk, or reversibility,
show an A/B comparison and record the choice. When there is no real tradeoff,
use the smallest path without inventing ceremony.

This keeps important product decisions with the user and keeps small work fast.

### 8. One task, one proof

Split complex work into dependency-aware tasks. Keep exactly one active task;
each task has one output, one verification, and a stop condition. Failed checks,
unstable reproductions, unproven assumptions, and missing approvals become
blockers instead of more speculative patches.

This makes work locatable, pausable, and resumable.

### 9. Match process to risk

- **Micro**: one local, reversible, low-risk edit with one clear acceptance check.
- **Fast**: ordinary multi-step or resumable low-risk work.
- **Full**: migrations, permissions, public contracts, cross-service changes,
  production-critical paths, or material uncertainty.

Small work stays lightweight while high-risk work retains rollback,
compatibility, security, and acceptance gates.

## Problems It Solves

| Common AI coding failure | What changes with this workflow |
| --- | --- |
| The agent implements a proposed solution without checking it | It validates the real problem and challenges a false premise |
| Bug fixes become layers of defensive patches | It reproduces the bug and fixes the shared cause |
| "Tests passed" has no command or output | Important claims point to actual evidence |
| A new session loses the previous context | `docs/WORKFLOW.md` routes directly to the unfinished change |
| UI is coded before the design is agreed | Existing visual language and a prototype come first |
| A complex task is changed all at once | One verifiable task advances at a time |
| Small work gets unnecessary infrastructure | The minimum-change ladder limits complexity |

## Workflow

```text
S0 Observe and classify
 -> S1 Align problem and acceptance
 -> S2 Model invariants and failure cost
 -> S3 Compare options or justify the minimum path
 -> S4 Prototype, contract, or failing test
 -> S5 Split the plan and select one active task
 -> S6 Implement the smallest code slice
 -> S7 Verify, review, and update memory
 -> S8 Close, hand off, or resume
```

## Runtime Modes

| Mode | Requirement | Evidence | Best for |
| --- | --- | --- | --- |
| Portable Markdown | AI tool and text files only | `manual-observed` Markdown | No Node.js or fully cross-language environments |
| Assisted | Node.js 18+ | `run-evidence.mjs` machine capture | Automatic sync, validation, and bounded command records |

Both modes share the same Markdown protocol. Node.js is an automation adapter,
not a target-project runtime requirement. See
[Portable Markdown Mode](references/portable-mode.md) for the complete no-Node
procedure.

## New Session Recovery

Always begin with `docs/WORKFLOW.md`. If Node.js is available, refresh it with:

```text
node <skill-path>/scripts/index.mjs resume <project-root>
```

Without Node.js, read the status block directly and update it by hand after
changing phase, status, task, blocker, last proven state, next action, or
acceptance. If multiple changes are unfinished, ask the user to choose a change
ID instead of guessing.

## Installation

Codex:

```bash
git clone https://github.com/yuxiang-lai/evidence-first-dev.git \
  ~/.codex/skills/evidence-first-dev
```

Windows PowerShell:

```powershell
git clone https://github.com/yuxiang-lai/evidence-first-dev `
  "$HOME\.codex\skills\evidence-first-dev"
```

For Cursor, Claude Code, Windsurf, Cline, Roo Code, Copilot, Gemini CLI, and
Aider, see [ADAPTERS.md](ADAPTERS.md). Adapters point to `SKILL.md`; they do not
copy a second workflow.

## Optional Commands

```text
node scripts/init.mjs <project-root> <YYYY-MM-DD-slug> <Fast|Full> <low|high> <type>
node scripts/index.mjs resume <project-root>
node scripts/index.mjs sync <project-root>
node scripts/run-evidence.mjs <project-root> <change-id> <task-or-ac> -- <command> [args...]
node scripts/validate.mjs <project-root> <change-id>
```

Without Node.js, do not run these commands. Use the Markdown templates and the
manual checklist instead.

## Repository Layout

```text
evidence-first-dev/
|-- SKILL.md                 canonical workflow rules
|-- README.md                Chinese documentation
|-- README.en.md             English documentation
|-- ADAPTERS.md              cross-tool integration
|-- adapters/                thin tool bridges
|-- references/              detailed workflow and evaluation rules
|-- templates/               repository-as-memory templates
|-- scripts/                 optional Node.js automation
`-- fixtures/                bug, UI, contract, and resume examples
```

## Scope

Do not force the full ledger onto read-only explanations, prose-only edits,
skill-authoring tasks, or one-line low-risk reversible changes. The structural
validator checks ledger shape; it does not replace project correctness, visual
review, or tamper-proof evidence signing.

## Development and Verification

```text
node scripts/validate.test.mjs
node scripts/validate.done.test.mjs
node scripts/run-evidence.test.mjs
node scripts/fixture-smoke.test.mjs
python <path-to-skill-creator>/scripts/quick_validate.py .
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and
[references/evals.md](references/evals.md).

## License

MIT. See [LICENSE](LICENSE).
