# Portable Markdown Mode

Portable Markdown Mode is the complete zero-runtime path. It is for projects
where Node.js is unavailable, undesirable, or not part of the developer's
toolchain. The target project's language and build tools remain independent:
use `make`, `ctest`, `mvn`, `gradle`, `cargo`, `go test`, `pytest`, or the
repository's actual command as appropriate.

## Start or resume

1. Open `docs/WORKFLOW.md` before reading the chat history.
2. Count the unfinished entries in the status block and inspect every linked
   `docs/changes/<id>/PROGRESS.md`.
3. If there is one active or blocked change, continue it. If there is more than
   one, stop and ask the user to choose a change ID.
4. Read the selected `PROGRESS.md`, then `PRD.md`, scoped `CONTEXT.md`,
   `DECISIONS.md`, `PLAN.md`, and the latest evidence or review.
5. Recheck the repository status and the last proven command before the first
   incomplete task.

If `docs/WORKFLOW.md` does not exist, create it from
`templates/WORKFLOW.md`. Create project memory from
`templates/PROJECT-CONTEXT.md`, then create a Fast or Full ledger by copying
the applicable files from `templates/`. Replace every placeholder before
moving past S0.

Set `Index mode: portable` in `docs/WORKFLOW.md` and set `Evidence mode:
portable` in both `PRD.md` and `PROGRESS.md`. This is
an explicit record that the ledger may use manual evidence because the
automation runner is unavailable. Do not claim machine capture.

## Keep the recovery index current

After changing phase, status, current task, blocker, last proven state, next
action, or acceptance status, update the generated block in
`docs/WORKFLOW.md`. Keep one compact entry for every active or blocked change:

```md
#### `2026-09-03-fix-retry`
- Mode / phase / risk / type / status: `Fast` / `S6` / `low` / `bug` / **active**
- Goal: prevent duplicate writes on retry
- Current AC: `AC-01`
- Current task: `T02: add regression test`
- Doing: add the failing test at the request boundary
- Next: run the focused test
- Last proven state: reproduction is captured
- Latest evidence: `npm test -- retry` -> exit 1, expected red test
- Blockers: none
- Ledger: [PROGRESS.md](changes/2026-09-03-fix-retry/PROGRESS.md)
```

The detailed ledger remains authoritative. The index only routes a new agent;
it must not contain a second, conflicting task state. In portable mode the
index may be hand-maintained, but it must always include the change ID and
`PROGRESS.md` path for each unfinished change.

## Capture manual evidence

Run the real project command in the current repository using the project's
normal terminal. For each task or AC, copy `templates/EVIDENCE.md` to
`docs/changes/<id>/evidence/<subject>-<short-name>.md` and fill every field.
Use the exact command and actual observed result:

```md
# Evidence E-001

- **Schema**: evidence-first-dev/manual-evidence-v1
- **Producer**: manual-observed
- **Subject**: AC-01
- **Command**: `mvn test -Dtest=RetryTest`
- **Observed at**: 2026-09-03T15:20:00+08:00
- **Result**: exit 0
- **Failure class**: success
- **Observation**: 1 test passed; 0 failures
- **Recorded by**: coding agent
- **Machine capture**: unavailable; this is manual evidence
- **Limitations**: terminal output was observed but not hash-captured
```

Use one evidence file for one subject. A failed command is valuable evidence:
record its actual non-zero exit and failure class, but do not use it to mark an
AC or task as passed. The allowed failure classes are `success`,
`non-zero-exit`, `timeout`, `output-limit`, `spawn-failure`, and `signal`.

Add the corresponding row to `PROGRESS.md`:

```md
| 2026-09-03 | AC-01 | `mvn test -Dtest=RetryTest` | exit 0, success | 1 test passed; [manual evidence](evidence/AC-01-retry.md) |
```

At closeout, add one line per AC to `REVIEW.md`:

```md
- AC-01: PASS - Command: mvn test -Dtest=RetryTest | Result: exit 0 | Evidence: [manual evidence](evidence/AC-01-retry.md)
```

Manual evidence proves that the command or observation was recorded by the
agent or person at that time. It does not provide the provenance, bounded
output, or tamper resistance of a machine-captured JSON record. If Node.js is
installed later, rerun important checks through `run-evidence.mjs` and link the
new machine evidence instead.

## Manual validation checklist

Before `Status: done`, inspect these conditions in order:

- `PRD.md` and `PROGRESS.md` agree on ID, mode, risk, status, and Evidence mode.
- `docs/WORKFLOW.md` lists every active or blocked change exactly once.
- Every AC is independently stated and has status `pass`.
- Every AC has a successful manual or machine evidence link in `PROGRESS.md`.
- Every AC has its own `PASS - Command - Result - Evidence` line in `REVIEW.md`.
- Every important `IC-*` check names an AC or task and has successful evidence.
- There are no active tasks, pending blockers, or unfinished plan rows.
- UI work has an approved `PROTOTYPE.md`; public contracts have their failure
  and compatibility fields; high-risk work has rollback and debt records.
- The final diff, relevant tests, and residual risks were reviewed from the
  files alone.

If a condition cannot be checked, record `SKIP` or a concrete blocker. Never
upgrade an unverified claim to `PASS` just because the intended command looks
correct.

## Switching back to automation

Portable mode is not a forked workflow. When Node.js becomes available:

1. Keep the existing Markdown records and manual evidence.
2. Run `node <skill>/scripts/index.mjs sync <project-root>` to regenerate the
   recovery index.
3. Run important commands through `run-evidence.mjs`.
4. Replace manual acceptance links only when the new machine evidence covers
   the same subject and result.
5. Change both `Evidence mode` fields to `machine` only after all required
   evidence uses the machine runner.

Do not rewrite historical manual evidence as if it had been machine captured.
