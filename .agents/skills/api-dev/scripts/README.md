# API-Dev Scripts

Four focused check scripts, one convenience wrapper, and one endpoint
listing utility. Each check script accepts files or directories and prints:

```
path:line: [SEVERITY] [RULE] message
```

### Exit Codes

| Code | Meaning |
| ---- | ------- |
| 0    | No findings |
| 1    | Findings emitted |
| 2    | Bad invocation |

---

## check.py (wrapper)

Runs **all four** check scripts in one pass.

```bash
python3 check.py src/
```

---

## check-security.py

API security rules.

```bash
python3 check-security.py src/controllers/ src/routes/
```

| Rule                       | Severity | Description |
| -------------------------- | -------- | ----------- |
| leak-stack-trace           | WARN     | Stack trace sent in HTTP response. |
| sql-injection-risk         | WARN     | SQL built via string concat with request data. |
| inline-secret              | WARN     | Hardcoded-looking secret/token/key. |
| cors-wildcard-with-creds   | WARN     | CORS `'*'` with `credentials:true`. |
| cors-wildcard              | INFO     | CORS `'*'` without credentials. |

---

## check-correctness.py

API correctness rules.

```bash
python3 check-correctness.py src/controllers/
```

| Rule              | Severity | Description |
| ----------------- | -------- | ----------- |
| status-200-error  | WARN     | HTTP 200 with error payload — use 4xx/5xx. |
| get-mutation      | WARN     | GET handler appears to mutate data. |
| swallow-catch     | WARN     | Empty `catch {}` or `except: pass`. |

---

## check-validation.py

Input validation and response type rules.

```bash
python3 check-validation.py src/controllers/
```

| Rule                  | Severity | Description |
| --------------------- | -------- | ----------- |
| unvalidated-input     | INFO     | Request body/query/params used without visible validator. |
| missing-response-type | INFO     | Controller file with no `*Response` type referenced. |

---

## check-structure.py

File organization and naming rules.

```bash
python3 check-structure.py src/
```

| Rule                      | Severity | Description |
| ------------------------- | -------- | ----------- |
| vendor-named-controller   | WARN     | Controller named after a vendor (`ExpressController`, etc.). |
| route-in-controller       | INFO     | Route registration inside a controller file. |
| fat-route-handler         | INFO     | Long inline handler in a route file (>10 lines). |
| db-in-middleware           | INFO     | Database client used inside middleware. |
| vague-method              | INFO     | Controller method named `handle`, `do`, `process`, `run`, `exec`, `main`. |

---

## list-endpoints.py

Scans route files for endpoint registrations and prints a table.

```bash
python3 list-endpoints.py src/routes/
python3 list-endpoints.py src/
```

Output:

```
METHOD  PATH                    FILE
──────  ──────────────────────  ──────────────────────────────
GET     /users                  src/routes/users.ts:12
POST    /auth/login             src/routes/auth.ts:25
```

Detects Express/Fastify/Koa-style `router.get('/path', ...)` and
NestJS-style `@Get('/path')` decorator patterns.

---

## Shared Module

`_common.py` contains the `Finding` class, path helpers, config constants,
and the `run_checks` driver. Not intended to be run directly.
