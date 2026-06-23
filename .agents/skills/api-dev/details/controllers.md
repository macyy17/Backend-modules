# Controllers

Controllers handle the request/response flow.

## Rules

A controller should:
- Read params, query, body, and auth context.
- Call a service or core function for behavior.
- Format and return a response object.
- Throw project HTTP errors and let the error middleware translate them.

A controller should not:
- Build SQL queries.
- Call repositories or providers directly when a service exists.
- Hold long-running state.
- Format multi-step business algorithms inline.

## File Layout

```txt
src/controllers/
|- auth/AuthController.ts
|- admin/AdminUsersController.ts
|- client/ClientProfileController.ts
```

One controller per file. File name matches the class name.

## Method Names

- Use verbs that match the action: `list`, `get`, `create`, `update`,
  `replace`, `delete`, `approve`, `refund`.
- Avoid generic names: `handle`, `do`, `run`, `process`.

## Inputs and Outputs

- Inputs are typed: `UserListRequest`, `CreateInvoiceRequest`.
- Outputs are typed: `UserListResponse`, `InvoiceResponse`.
- Validation runs before the controller method body (middleware or first
  statement).
- The controller transforms validated input into a service call, then maps
  the service result into the response type.

## Anti-Patterns

- A controller that owns a multi-paragraph algorithm.
- A controller that returns a raw ORM model.
- A controller that catches generic `Error` and returns `200`.
- A controller named `MainController`, `DataController`, `IndexController`.
