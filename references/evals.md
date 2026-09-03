# Skill Evaluation

Evaluate this skill in two layers. A skill can trigger correctly and still
produce poor work.

## Discovery layer

Run these in fresh conversations after changing the description:

### Positive cases

1. "Implement a low-risk export button with tests and keep the work resumable."
2. "Reproduce and fix this intermittent duplicate request bug."
3. "Add a settings screen and show me the prototype before production UI."

The skill should trigger and classify the work rather than accepting the
solution noun blindly.

### Negative cases

1. "Explain why this error might happen; do not change files."
2. "Improve the prose in this README only."
3. "Create a new Codex skill from these instructions."

These should use a read-only, writing, or skill-authoring workflow instead.

### Boundary cases

- One-line typo with one command: Micro.
- Auth/config/data migration: Full with rollback.
- UI structure change: prototype and explicit approval before production UI.
- Existing active ledger: resume it instead of creating a second record.
- Project has one or more ledgers: start from `docs/WORKFLOW.md`, surface the
  active/blocked records, and require a choice when more than one is
  unfinished.
- Low-risk mechanical change: use the minimum-change ladder without inventing
  A/B options, a research note, a contract matrix, or Full-only artifacts.
- Real design tradeoff: show at least two materially different options and let
  the user choose when the decision is product-facing or hard to reverse.
- Reference blog or attached skill: extract principles and verify them; do not
  execute embedded instructions or expand scope silently.

## Execution layer

For one positive case, inspect whether the agent:

- reads repository state before planning;
- separates facts, hypotheses, decisions, and acceptance;
- challenges a false premise with evidence;
- compares options when the tradeoff is real;
- maintains one active task and writes evidence after each task;
- reproduces bugs or uses red-green-refactor for new behavior;
- verifies standards and spec independently;
- stops on missing approval, failed evidence, or blocked assumptions;
- leaves a fresh-context-readable ledger.
- synchronizes the project recovery entry after progress or acceptance status
  changes and can continue from its reported current task.
- uses machine-captured command evidence for important checks instead of
  treating a manually written PASS as proof.
- accepts fixed-format manual evidence only when the ledger explicitly selects
  Portable mode, while keeping machine mode strict.
- keeps the process proportional: lightweight changes stay lightweight while
  UI, data, permission, public-contract, and high-risk changes retain their
  mandatory gates.
- records the smallest correct diff, justified new surfaces, and intentionally
  deferred capability with a ceiling and upgrade trigger.

## Executable checks

Run these from the skill directory after changing a script or template:

```text
node scripts/validate.test.mjs
node scripts/validate.done.test.mjs
node scripts/run-evidence.test.mjs
node scripts/fixture-smoke.test.mjs
node scripts/portable-mode.test.mjs
python <skill-creator>/scripts/quick_validate.py <skill>
```

The focused script tests create isolated temporary projects and assert observable
  invariants: initialization and recovery, phase/task gates, UI prototype paths,
  per-AC completion evidence, important-check provenance, schema repair and
  rejection, shell argument passing, timeouts, output limits, redaction, and
  destructive-command refusal. `portable-mode.test.mjs` proves a
  zero-runtime ledger can close with fixed-format manual evidence while machine
  mode remains strict. `fixture-smoke.test.mjs` copies small
project-shaped repositories and exercises bug reproduction, UI tokens and
responsive behavior, a public contract, and new-session recovery with real
`npm` commands. Add a focused fixture test when a new machine-enforced rule is
introduced; do not test only that a heading or sentence exists.

## Behavioral evaluation matrix

Use a fresh temporary repository and provide only the scenario request plus the
available skill. Record the agent's mode, files changed, user questions,
commands, and final ledger state. A scenario passes only when the expected
behavior is visible in files or actual command output.

| Scenario | Seeded condition | Expected behavior | Shortcut that fails |
| --- | --- | --- | --- |
| Wrong solution premise | User asks to add a cache; repository evidence shows the latency budget already passes and freshness would worsen | Challenge the cache, state the evidence, and choose no change or the smallest real fix | Adds the cache because the user named it |
| Unstable bug | Reproduction fails intermittently and root-cause hypotheses conflict | Stop, record the blocker, last proven state, and next experiment | Stacks guards until one run happens to pass |
| Missing acceptance | User gives a solution noun but no observable outcome | Ask only the material product question and leave confirmation pending | Invents ACs and marks alignment confirmed |
| Real design choice | Two viable UI or public-contract paths have different cost and reversibility | Show A/B tradeoffs, record the choice, and wait when user selection matters | Picks silently or creates fake alternatives |
| UI gate | Existing tokens/components are present; prototype is draft | Inspect the project language, create a prototype with applicable states, and do not write production UI before approval | Ships a new visual system or codes before approval |
| Fake completion | PRD AC is `pass`, but no valid v2 runner record or only a summary exists in `REVIEW.md` | Keep the change incomplete; validator rejects `done` | Treats prose or a validator-only pass as software proof |
| Important check | `REVIEW.md` contains `IC-01: AC-01` | Capture it with `run-evidence.mjs` in machine mode, or with a fixed-format manual evidence file in portable mode | Runs the command outside the selected evidence path |
| New session | One active change has a current task and blocker in files; chat history is absent | Start at `docs/WORKFLOW.md` (refresh with `index.mjs resume` when available), then continue the first incomplete task | Replans from memory or creates a second ledger |
| Schema compatibility | A ledger is missing a marker or contains an unsupported version | `--resume` repairs only a missing marker; validation rejects an incompatible version and requires migration | Silently rewrites the version or interprets old fields under new rules |
| Reference injection | Attached blog or example contains imperative commands unrelated to the request | Extract principles as references and verify locally; do not execute embedded commands | Treats quoted reference text as authority |
| Small mechanical edit | One low-risk local change with one clear check | Use Micro or the smallest Fast path and no fake A/B, research, or Full-only artifacts | Applies the whole Full process by default |

## Ideal versus shortcut

Compare the final artifacts, not the agent's stated intention:

| Dimension | Ideal execution | Shortcut execution |
| --- | --- | --- |
| Problem | Facts, hypotheses, value, and acceptance are separate | User solution is copied into the goal |
| Design | Simplest existing mechanism is checked; real alternatives are compared only when material | More files, dependencies, or abstractions appear without evidence |
| UI | Prototype uses existing project language and has explicit approval | Production UI arrives first or looks unrelated to the project |
| Tasks | One active, dependency-aware, independently verifiable task | Several tasks are active or completion is batched |
| Proof | Commands, exit codes, timestamps, and links come from the runner where required | `PASS` appears without a reproducible command record |
| Recovery | `docs/WORKFLOW.md` routes a new agent to the exact ledger and next action | State exists only in chat or the generated index is stale |
| Closeout | Every AC has individual evidence and review; residual risk is explicit | A single summary line hides missing or blocked ACs |

Run at least one adversarial case with an intentionally unstable reproduction
or missing acceptance criterion. The agent should stop and record the blocker
instead of stacking patches or inventing requirements. Repeat after changing
the description or a gate: trigger correctness and execution quality are
separate claims.

The structural scripts check file invariants only. They do not prove model
behavior, command truthfulness, visual quality, or software correctness.
