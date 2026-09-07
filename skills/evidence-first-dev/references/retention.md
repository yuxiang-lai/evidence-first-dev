# Memory Retention And Compaction

The repository is the durable memory, but not every durable record belongs in
the new-session entry. Keep the hot path short and keep detailed history at
the change that created it.

## Bounded layers

| File or directory | Keep | Growth rule |
| --- | --- | --- |
| `docs/WORKFLOW.md` | Every active/blocked change and the 10 newest done changes | Generated status is bounded; older done changes stay under `docs/changes/` |
| `docs/CONTEXT.md` | Current project facts and the 5 newest project-wide updates | Update facts in place; do not append a session diary |
| `docs/DEBTS.md` | Unpaid debt only | Remove or mark a debt repaid; closeout history stays in its change ledger |
| `docs/changes/<id>/` | Full history for one change | One directory per change; do not copy it into project-level files |
| `docs/changes/<id>/evidence/` | Evidence needed to audit that change | Keep important evidence; use `--no-preview` for sensitive or bulky output |

The number of completed change directories is intentionally unbounded. They
are cold history, not context loaded into every new session. Deleting them to
make the project look small destroys the recovery trail and may break links.

## When a file gets too large

1. Run `node <skill>/scripts/index.mjs check <project-root>` when Node.js is
   available. In portable mode, count the bounded sections manually.
2. For `docs/CONTEXT.md`, replace stale values in the current sections and keep
   only the newest five rows in `Update history`.
3. Move older project-wide history to an explicitly named file such as
   `docs/archive/PROJECT-CONTEXT-history.md`. Keep the source/date and link it
   from the current file if the history still matters.
4. Never move an active or blocked change, and never replace a change ledger
   with a summary. The change ledger remains the authoritative record.
5. Run `index.mjs sync` and the relevant validator after compaction. Treat a
   broken link, lost blocker, missing debt, or contradictory current fact as a
   failed compaction.

Compaction is a reviewable documentation change, not an automatic deletion.
The workflow deliberately does not guess which historical fact is safe to
discard.

## Why this avoids operational problems

- New sessions read a bounded routing file instead of every historical record.
- Current facts have one ownership location, reducing contradictory copies.
- Completed work remains auditable without increasing prompt context by default.
- Machine evidence already limits captured output; secrets are redacted before
  previews and hashes are computed.

If the current entry is still slow to read, the first remedy is to improve the
index or remove duplicated prose, not to weaken the evidence or delete an
unfinished change.
