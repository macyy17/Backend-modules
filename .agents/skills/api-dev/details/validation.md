# Validation

Validate every external input at the boundary.

## What To Validate

- `params` (path parameters).
- `query` (query string).
- `body` (request body).
- `headers` you depend on (e.g., `Authorization`, `Content-Type`).

## Where

- Use a validation middleware OR validate as the first step in the controller.
- Choose one place per project — do not mix both for the same endpoint.

## How

- Use a schema library (Zod, Yup, Joi, class-validator, Pydantic, Marshmallow,
  Valibot).
- Convert validated input into a typed `Request` object.
- On failure, return `422 Unprocessable Entity` (or `400 Bad Request` if your
  project uses 400 for validation).
- Return a structured error envelope listing failing fields.

## Defense-in-Depth

- Validate again at service boundaries when the service can be called by
  workers, jobs, or other entry points.
- Domain rules (business validation) belong in the core or service layer,
  not in the request validator.

## Common Rules

- Required vs optional must be explicit.
- String fields: max length, allowed characters, trimming policy.
- Numbers: range, integer vs decimal.
- IDs: format (UUID, ULID, numeric).
- Dates: ISO-8601 with timezone.
- Enums: explicit allowed values, not free strings.

## Anti-Patterns

- Reading `req.body.x` without checking it exists.
- Casting unknown JSON to a typed object without runtime check.
- Returning `200` for failed validation.
- Letting an ORM constraint error propagate as the validation message.
