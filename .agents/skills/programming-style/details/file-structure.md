# File Structure

Files should be small enough to understand and easy to locate.

## Main Rule

One primary class, function, type, interface, job, event, or listener per file.

Allowed exceptions:
- Index/barrel files.
- Small local helper types private to the file.
- Tiny enum/constant groups only meaningful together.
- Test files grouping closely related scenarios.

## Export Rules

- Prefer named exports.
- Avoid large default exports.
- Export only the main responsibility.
- Keep local helpers unexported.

## File Order

For function files:
1. Imports
2. Constants
3. File-local types
4. Main export
5. Local helpers

For class files:
1. Imports
2. Class declaration
3. Properties
4. Constructor
5. Public methods
6. Protected methods
7. Private methods

## Split A File When

- It has multiple responsibilities.
- It mixes transport, business rules, and persistence.
- It has many unrelated private helpers.
- A clear subdomain emerges.

## Anti-Patterns

- `helpers.ts` with unrelated functions.
- `types.ts` with unrelated contracts.
- `service.ts` with many unrelated methods.
- `index.ts` that re-exports a complete app tree.
- Mixing real code and test-only code.

## Size Guidance

- Function file: usually under 80 lines.
- Class file: split at 300-400 lines unless cohesive.
- Any file > 500 lines is a strong split signal.
