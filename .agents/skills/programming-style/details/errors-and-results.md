# Errors and Results

Make failures easy to understand and recover from.

## Error Rules

- Throw for exceptional failures.
- Return result objects for expected business outcomes.
- Keep error messages clear and actionable.
- Include enough context to debug.
- Never leak secrets in error messages or logs.

## Result Rules

- Use `Result` types for domain operations with multiple valid outcomes.
- Keep success and failure shapes explicit.
- Avoid returning `null` when the reason matters.
- Do not mix thrown errors and silent `false` values for the same operation.

## At Boundaries

- Validate external input.
- Normalize external data.
- Convert library errors into project-level errors.
- Preserve original error context in logs (when safe).

## CLI / Worker Output

- Print JSON for expected output.
- Print clear errors for failed execution.
- Exit with non-zero status on failure.
- Keep machine-readable output stable.

## HTTP / API Output

- Return stable status codes.
- Return a stable error response shape.
- Never expose stack traces to users.
- Keep logs richer than user-facing errors.

## Anti-Patterns

- `catch (e) {}` swallowing errors silently.
- Wrapping every line in `try/catch`.
- Returning `-1`, `null`, or `false` for unrelated failure modes.
- Re-throwing with no added context when context would help.
