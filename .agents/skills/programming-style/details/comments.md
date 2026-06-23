# Comments

Comments organize code and explain non-obvious choices.
They do not narrate obvious statements.

## Group Comments

Use short group comments for large sections:

```ts
// -------
// Imports
// -------
```

```ts
// -------
// Service
// -------
```

## Class Files

Group examples:
- Imports
- Class
- Properties
- Constructor
- Core methods
- Utility methods
- Private methods

Keep groups short. One-method groups add noise.

## Function Files

Usually only:
- Imports
- Main function

Avoid heavy sectioning in a small single-function file.

## Inline Comments

Use when:
- The reason is not obvious.
- The code guards a subtle edge case.
- The code follows an external rule or protocol.
- The code avoids a simpler-looking approach for a reason.

Avoid when:
- The function name already explains the action.
- The code is a direct assignment.
- The comment repeats a condition.

## Bad Examples

```ts
// Set user id
user_id = user.id;

// Handle data
process(data);
```

## Better Examples

```ts
// Keep the original request id so retries can be joined in logs.
const trace_id = req.id;

// Provider returns cents; invoices store decimal amounts.
const amount = response.cents / 100;
```

## TODOs

- Never leave a `TODO` without owner or next action.
- Prefer small docs files over long comments for cross-module rules.
