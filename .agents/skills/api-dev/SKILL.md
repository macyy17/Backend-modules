---
name: api-dev
description: Designs, writes, or reviews HTTP/REST API code (routes, controllers, middlewares, request/response types) covering validation, status codes, error envelopes, and auth; includes a script that prints concise file-line findings.
version: 1.0.0
author: MAbdullahAhmad
tags: [api, http, rest, controllers, routes, validation, errors, auth]
triggers:
  - "add this endpoint"
  - "review this controller"
  - "fix this route"
  - "design a response shape"
  - "add input validation"
  - "audit api errors"
---

# SKILL: API Development

## When to Use This Skill

Activate when the user asks to:
- Add or modify a route, controller, or middleware.
- Define request/response/payload types for an endpoint.
- Review API error handling, status codes, or error envelope.
- Add input validation at a controller boundary.
- Audit a backend file or folder.

Do NOT activate when:
- The work is UI/component related → use `frontend-dev`.
- The work is high-level layer boundaries → use `software-architecture`.
- The work is naming or comment style only → use `programming-style`.

---

## Phase 1 — Detect Issues

Pick the script that matches the task, or run `check.py` for a full audit:

| Script                 | Use when …                                            |
| ---------------------- | ----------------------------------------------------- |
| `check-security.py`    | Auditing for secrets, SQL injection, CORS, stack leaks |
| `check-correctness.py` | Reviewing status codes, catch blocks, GET mutations   |
| `check-validation.py`  | Adding/reviewing input validation and response types  |
| `check-structure.py`   | Reviewing controller/route/middleware organization    |
| `check.py`             | Full audit (runs all four above)                      |

```bash
python3 skills/api-dev/scripts/check-security.py src/controllers/
python3 skills/api-dev/scripts/check-structure.py src/
python3 skills/api-dev/scripts/check.py src/
```

Use `list-endpoints.py` to see all registered endpoints:

```bash
python3 skills/api-dev/scripts/list-endpoints.py src/routes/
```

See `scripts/README.md` for the full rule list and exit codes.

---

## Phase 2 — Apply Fixes

Apply changes in this order:

1. **Security** — remove SQL string concat with request data, scrub leaked
   stack traces, remove hardcoded secrets, tighten CORS.
2. **Correctness** — return the right status code for each outcome; never
   `200` with an error payload; never `GET` that mutates.
3. **Contract** — validate `params`/`query`/`body` at the boundary; define
   `*Request`/`*Response` types; return the project error envelope.
4. **Structure** — move route registration out of controllers; move business
   logic out of routes; move DB access out of middleware.
5. **Naming** — use verb-based method names (`list`, `create`, `approve`)
   instead of `handle`/`do`/`process`.

For deeper rules, read only the topic that matches the task:

| Topic         | File                          |
| ------------- | ----------------------------- |
| Routes        | `details/routes.md`           |
| Controllers   | `details/controllers.md`      |
| Validation    | `details/validation.md`       |
| Status codes  | `details/status-codes.md`     |
| Errors        | `details/errors.md`           |
| Auth          | `details/auth.md`             |

---

## Phase 3 — Verify

1. Re-run `scripts/check.py` — must have no WARN findings.
2. Every endpoint has validation at the boundary.
3. Every error path returns a stable envelope and correct status code.
4. No stack trace, secret, or env value can leak to the client.
5. Report changes as an endpoint table (method, path, status, request type,
   response type) plus a list of `file:line - rule - fix`.

---

## Quick Reference

### HTTP Method Decisions

| Action                          | Method     |
| ------------------------------- | ---------- |
| Read; idempotent; no mutation   | `GET`      |
| Create resource                 | `POST`     |
| Replace resource (idempotent)   | `PUT`      |
| Partial update                  | `PATCH`    |
| Remove resource                 | `DELETE`   |

### Common Status Codes

| Outcome                                   | Code |
| ----------------------------------------- | ---- |
| Success with body                         | 200  |
| Resource created                          | 201  |
| Success no body                           | 204  |
| Malformed request                         | 400  |
| Missing/invalid auth                      | 401  |
| Authenticated but not allowed             | 403  |
| Not found                                 | 404  |
| Conflict (duplicate, race, version)       | 409  |
| Validation failed                         | 422  |
| Rate-limited                              | 429  |
| Unexpected server fault                   | 500  |
| Upstream failure                          | 502  |
| Maintenance / dependency down             | 503  |

### Error Envelope

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "The requested user does not exist.",
    "details": {}
  }
}
```

### Script Rules (summary)

| Rule                     | Severity | Meaning                                              |
| ------------------------ | -------- | ---------------------------------------------------- |
| status-200-error         | WARN     | `status(200)` with an error payload                  |
| leak-stack-trace         | WARN     | `error.stack` sent in response                       |
| sql-injection-risk       | WARN     | SQL built via concat/interpolation with `req.*`      |
| inline-secret            | WARN     | Hardcoded-looking secret                             |
| get-mutation             | WARN     | `GET` handler that mutates                           |
| cors-wildcard-with-creds | WARN     | `Access-Control-Allow-Origin: *` + `credentials:true`|
| vendor-named-controller  | WARN     | Controller named after a vendor                      |
| unvalidated-input        | INFO     | `req.body/.query/.params` used without a validator   |
| route-in-controller      | INFO     | Route registration inside a controller               |
| fat-route-handler        | INFO     | Long inline handler in a route file                  |
| db-in-middleware         | INFO     | DB client used inside middleware                     |
| vague-method             | INFO     | Method named `handle`/`do`/`process`                 |
| missing-response-type    | INFO     | No `*Response` type referenced in a controller       |

---

## Common Mistakes to Avoid

| Anti-pattern                                                       | Correct approach                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `res.status(200).json({ error: ... })`                             | Use a 4xx/5xx code and the project error envelope                 |
| `res.send({ stack: err.stack })`                                   | Log server-side; return `{ error: { code, message } }`            |
| `"SELECT ... WHERE name='" + req.query.name + "'"`                 | Parameterized query or query builder                              |
| `GET /users/refund` that mutates                                   | `POST /users/:id/refund`                                          |
| Validation in some controllers, skipped in others                  | Validate every endpoint at the boundary                           |
| `class ExpressUsersController`                                     | Name controllers by role: `AdminUsersController`                  |
| Different error shape per endpoint                                 | One stable error envelope project-wide                            |
| Catching all errors and returning `200 { ok: false }`              | Convert to project errors; let middleware map to status + body    |
| Hardcoded `JWT_SECRET = "super-secret-string-..."` in source       | Load from env; rotate keys                                        |
| `app.get(...)` registered inside a controller class                | Register in `routes/`; controller exposes a method               |

---

## Quality Checklist

- [ ] `scripts/check.py` returns no WARN findings on changed files.
- [ ] Every endpoint validates `params`, `query`, and `body` it reads.
- [ ] Every error path returns the project envelope and a 4xx/5xx status.
- [ ] No stack trace, env value, or secret is in any response body.
- [ ] Every endpoint has a `*Request` and a `*Response` type (or documented absence).
- [ ] `GET` endpoints are read-only and idempotent.
- [ ] Routes register paths; controllers handle one method each.
- [ ] CORS does not combine `*` origin with `credentials: true`.

---

## Changelog

| Version | Date       | Change          |
| ------- | ---------- | --------------- |
| 1.0.0   | 2026-05-21 | Initial release |
