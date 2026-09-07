# Review Checklist

Use only checks relevant to the changed surface. This checklist supplements
project-specific standards; it does not replace them.

## Specification

- Every AC is covered by a focused check and has actual evidence.
- The implementation matches the stated actor, trigger, outcome, and scope.
- Rejected or deferred behavior is explicit rather than silently omitted.

## Correctness

- Empty, null, missing, malformed, maximum, and boundary values.
- Duplicate actions, retries, concurrency, ordering, and idempotency.
- Shared ownership boundary handles the rule for all callers.
- Error paths preserve useful context and do not report false success.

## Security and data

- Authentication and authorization are checked at the resource boundary.
- User-controlled input is validated and safely encoded.
- Sensitive data is not leaked into logs, errors, or telemetry.
- Migration, compatibility, backup, and rollback behavior are concrete.

## Reliability and performance

- Dependency timeout, 5xx, partial failure, and retry behavior are defined.
- The implementation respects existing capacity, latency, and payload budgets.
- New caches, queues, locks, or background work have invalidation and failure
  behavior that is tested or explicitly bounded.
- Logs/metrics/traces make the new failure mode diagnosable.

## UI and accessibility

- Prototype approval precedes production UI code when the UI gate applies.
- Existing tokens, components, typography, spacing, and responsive rules are
  reused.
- Keyboard access, focus order, labels, contrast, loading, empty, error, and
  disabled states are usable.
- Text, controls, and feedback do not overlap or overflow on target viewports.

## Maintainability

- No unrelated refactor, formatting churn, speculative abstraction, or new
  dependency was added.
- Simplifications state their ceiling and upgrade trigger.
- Tests fail for the old behavior and pass for the intended behavior where
  practical.
- The ledger, diff, and actual evidence tell the same story.
