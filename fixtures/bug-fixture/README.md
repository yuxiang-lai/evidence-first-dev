# Bug Fixture

The request handler writes every request, including a retry with the same
idempotency key. `npm run reproduce` is an intentionally failing, deterministic
reproduction. The baseline test stays green so the fixture can be inspected
before an agent adds a regression test at the request boundary.
