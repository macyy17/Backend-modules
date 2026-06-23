# Errors

API errors must be stable, safe, and easy to debug.

## Error Envelope

Pick one envelope for the whole project. Example:

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "The requested user does not exist.",
    "details": {}
  }
}
```

- `code` is a stable machine string (UPPER_SNAKE_CASE).
- `message` is a short human sentence.
- `details` is optional, structured, never a stack trace.

## Conversion

- Controllers throw project HTTP errors (`NotFoundError`, `ValidationError`,
  `ConflictError`, `UnauthorizedError`, `ForbiddenError`).
- Shared error middleware converts thrown errors to the envelope + status.
- Library / driver errors are caught in the service or middleware and
  re-thrown as a project error with a stable `code`.

## Rules

- Never leak stack traces, query strings, or env values to clients.
- Never include secrets in `message` or `details`.
- Log the original error server-side with full context (request id,
  user id, query).
- Keep the user-facing message stable across versions where possible.

## Validation Errors

- Code: `VALIDATION_FAILED` (or per-field codes).
- Status: 400 or 422 (one per project).
- `details` lists fields with messages:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Some fields are invalid.",
    "details": [
      { "field": "email", "code": "EMAIL_INVALID", "message": "..." },
      { "field": "age",   "code": "AGE_OUT_OF_RANGE", "message": "..." }
    ]
  }
}
```

## Idempotency Errors

- Treat duplicate creation requests with the same `Idempotency-Key` as the
  original outcome.
- Race conditions on uniqueness return 409, not 500.

## Anti-Patterns

- Returning `{ ok: false }` with status 200.
- Returning a different error shape per endpoint.
- Wrapping every library error in a generic 500.
- Logging the user-facing message and nothing else.
