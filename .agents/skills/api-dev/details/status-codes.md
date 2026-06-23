# Status Codes

Use stable, meaningful HTTP status codes.

## Success

| Code | Use |
| ---- | --- |
| 200 OK            | Successful GET, PUT, PATCH, POST that returns content. |
| 201 Created       | Successful resource creation. Include `Location` if relevant. |
| 202 Accepted      | Async work queued; not yet completed. |
| 204 No Content    | Successful action with no response body (e.g., DELETE). |

## Client Errors

| Code | Use |
| ---- | --- |
| 400 Bad Request          | Malformed request the client should fix. |
| 401 Unauthorized         | Missing or invalid credentials. |
| 403 Forbidden            | Authenticated but not allowed. |
| 404 Not Found            | Resource does not exist. |
| 405 Method Not Allowed   | Path exists but method is wrong. |
| 409 Conflict             | State conflict (duplicate, race, version mismatch). |
| 410 Gone                 | Resource was here and is permanently removed. |
| 422 Unprocessable Entity | Valid syntax but invalid semantics (validation). |
| 429 Too Many Requests    | Rate-limited. |

## Server Errors

| Code | Use |
| ---- | --- |
| 500 Internal Server Error | Unexpected exception. |
| 502 Bad Gateway           | Upstream failure. |
| 503 Service Unavailable   | Maintenance, overload, dependency down. |
| 504 Gateway Timeout       | Upstream timed out. |

## Rules

- Never use 200 for an error result.
- Never use 404 for an authorization failure (prefer 403).
- Pick `400` OR `422` for validation and stick with it project-wide.
- Use 401 only when authentication is missing or invalid, not when an
  authenticated user lacks permission.
- Use 5xx only for server faults, not for user mistakes.

## Headers

- `Location` on 201 when a resource has a stable URL.
- `Retry-After` on 429 and 503.
- `Cache-Control` on cacheable GETs.
- `ETag` / `Last-Modified` for conditional requests when relevant.
