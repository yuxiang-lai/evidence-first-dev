# Schema And Upgrade Policy

The workflow has small, independently versioned file contracts. Versioning is
there to prevent a newer validator from silently assigning a new meaning to an
old record.

## Current contracts

| Contract | Current version | Owner | Purpose |
| --- | --- | --- | --- |
| Project context | `evidence-first-dev/project-context-v1` | `docs/CONTEXT.md` | Stable repository facts |
| Recovery entry | `evidence-first-dev/workflow-v1` | `docs/WORKFLOW.md` | New-session routing |
| Change ledger | `evidence-first-dev/change-ledger-v1` | `PRD.md`, `PROGRESS.md` | Change state and scope |
| Machine evidence | `evidence-first-dev/command-evidence-v3` | `evidence/*.json` | Bounded command provenance |
| Manual evidence | `evidence-first-dev/manual-evidence-v1` | `evidence/*.md` | Honest zero-runtime observation |

## What requires a version bump

Create a new version when a required field, allowed status, evidence meaning,
validation gate, or compatibility rule changes. An optional field, wording
clarification, or additional non-required reference does not require a bump.

The v3 machine evidence contract specifically requires a command, a recognized
failure class, and `redaction: applied-before-preview-and-hash`. Its hashes and
previews are calculated from redacted output. This is privacy protection, not a
cryptographic signature or tamper-proof audit log.

## Upgrade rules

1. A missing version marker may be added by `init.mjs --resume` or
   `--upgrade` when the existing file's meaning is unchanged.
2. An unsupported version must fail validation and must never be rewritten just
   to make the validator pass.
3. Preserve the old record, document field mapping and unresolved meaning in a
   migration note, transform the record explicitly, then rerun affected
   commands and evidence.
4. Old machine evidence is not upgraded by editing JSON. Rerun the command with
   the current runner; keep the old record as historical evidence when useful.
5. Portable mode is explicit and additive. Do not reinterpret a machine ledger
   as portable merely because Node.js is unavailable.

## Compatibility checklist

Before changing a contract, update the producer, parser, validator, templates,
tests, fixtures, and user-facing documentation together. Add at least one
fixture that proves an old or malformed record is rejected, and one current
record that is accepted. Keep the migration path documented in the same pull
request as the schema change.
