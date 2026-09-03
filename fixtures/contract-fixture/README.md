# Contract Fixture

The API module and the checked-in OpenAPI-like document form one public
boundary. A contract change must inspect callers, compatibility, errors, and
rollback rather than changing only the implementation file.
