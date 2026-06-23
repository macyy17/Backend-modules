# Formatting

Reduce noise and make diffs easy to review.

## General

- Follow the project formatter.
- Keep formatting automatic where possible.
- Avoid manual style debates a tool can decide.
- Keep import order stable.
- Prefer small changes over whole-file churn.

## Imports

- Group imports by origin: built-in, external, local.
- Keep built-in before external before local.
- No unused imports.
- Do not import from deep internal paths of packages unless required.

## Whitespace

- Blank lines separate concepts.
- No double blank lines without purpose.
- Compact small object literals when readable.
- Break long structures across lines.

## Functions

- Easy-to-scan argument lists.
- Use an options object when argument order is unclear.
- Avoid deep nested blocks.
- Return early on invalid input when it simplifies flow.
- Keep side effects visible.

## Constants

- File-level constants near the top.
- `UPPER_CASE` for fixed constants.
- Derived values near the code that derives them.
- Avoid magic strings shared across files.

## Generated Output

- Do not edit generated files.
- Do not commit generated output unless required by the project.
- Keep build artifacts out of `docs/` and `src/`.
