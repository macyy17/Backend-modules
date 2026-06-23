# Routes

Routes register paths and attach handlers. They are thin.

## Rules

- Group routes by feature or role (`auth`, `admin`, `client`, `system`).
- Compose nested route files via a root router.
- Attach middlewares in obvious places (auth guards, validators).
- Routes never contain business logic.

## Layout

```txt
src/routes/
|- index.ts            # composes all sub-routers
|- auth/
|- admin/
|- client/
|- dev/
|- helpers/
```

## Path Conventions

- Use plural nouns for collections: `/users`, `/invoices`.
- Use a path parameter for a single resource: `/users/:id`.
- Use sub-resources for nested data: `/users/:id/sessions`.
- Use a verb only when an action does not map to a CRUD operation:
  `/invoices/:id/refund`.
- Lowercase, dash-separated when multi-word: `/access-tokens`.
- Never embed identifiers that change in the URL (e.g., session id, query
  filter values).

## HTTP Methods

| Method | Use                                       |
| ------ | ----------------------------------------- |
| GET    | Read; idempotent; never mutate.           |
| POST   | Create; non-idempotent action.            |
| PUT    | Replace a whole resource (idempotent).    |
| PATCH  | Partial update (idempotent when possible).|
| DELETE | Remove a resource (idempotent).           |

## Anti-Patterns

- `GET` endpoints that mutate.
- Verbs in collection paths (`/getUsers`, `/createInvoice`).
- One mega-route file containing everything.
- Inline auth checks duplicated in every handler.
