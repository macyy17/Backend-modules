# Auth

Authentication and authorization belong in middleware, not in controllers.

## Authentication

- Decide one scheme per audience: Bearer (JWT/opaque), session cookie, API key.
- Mixing schemes is allowed only when each audience is clearly separated
  (e.g., `/admin` uses sessions, `/api/v1` uses Bearer tokens).
- Validate tokens in a single middleware (`BearerTokenAuthGuard`,
  `SessionAuthMiddleware`).
- Attach the authenticated user to the request context — not on the global
  object.

## Authorization

- A middleware named `RoleGuard` or `PermissionGuard` enforces access control.
- Controllers may add resource-level checks (e.g., "user owns this invoice").
- 401 for missing/invalid auth.
- 403 for authenticated-but-not-allowed.
- Never reveal existence by returning 404 when 403 is correct (and the
  reverse — pick a project-wide rule and document it).

## Tokens

- Tokens never appear in logs or error messages.
- Tokens are validated by signature + audience + expiry.
- Rotate signing keys; support multiple active keys during rotation.
- Refresh tokens are stored hashed and revocable.

## Passwords

- Hash with a modern KDF (argon2id, bcrypt with cost ≥ 12).
- Never log or echo a password.
- Reject password change without the current password unless an admin recovery
  flow is in place.

## CSRF

- Cookie-based auth needs CSRF protection (token or SameSite=strict + custom
  header).
- Bearer-only APIs over a non-cookie origin do not need CSRF tokens.

## CORS

- Allow only known origins.
- Do not use `Access-Control-Allow-Origin: *` with credentials.
- Limit allowed methods and headers to what the API uses.

## Anti-Patterns

- `req.user` populated from query params or body.
- Auth checked in some controllers and skipped in others.
- Different status codes for "wrong password" vs "user does not exist"
  (allows enumeration).
- Storing JWTs in `localStorage` when XSS risk is real.
