# Multi-Module Projects

Use a multi-module layout when a repo holds multiple independent servers,
services, or tools.

## When To Use

Choose multi-module when:
- Two or more deployables share a repo (api, worker, dashboard).
- Dependency trees differ enough that one `package.json` is awkward.
- Independent versioning or release cadence is desired.

Stay single-module when:
- One `src/` with clear folders is enough.
- Splitting is being done "just in case".

## Layout

```txt
project/
|- servers/
|  |- api/
|  |  |- src/
|  |  |- tests/
|  |  |- scripts/
|  |  |- package.json
|  |- dashboard/
|  |  |- src/
|  |  |- tests/
|  |  |- package.json
|- tools/
|  |- cli/
|  |  |- src/
|  |  |- package.json
|- services/
|  |- queue-worker/
|  |  |- src/
|  |  |- package.json
docs/
|- developer/
|- user/
scripts/
|- deploy.bash
|- setup.bash
README.md
```

## Rules

- Each module has its own package manager config.
- Each module has its own `src/`, `tests/`, and optionally `scripts/`.
- Each module has its own `.env` files.
- Root `scripts/` handles cross-module orchestration.
- Root `docs/` covers the whole project.
- Shared code is extracted into a package, not cross-imported.

## Cross-Module Imports

- Do not import directly across modules (`servers/api/...` from
  `servers/dashboard/...`).
- Extract shared logic into a workspace package (`packages/shared/...` or a
  separately published library).
- Shared types may live in a package or be duplicated by intent when the
  modules need to evolve independently.

## Migration From Single To Multi

1. Identify the smallest deployable surface.
2. Move it into `servers/<name>/` with its own `package.json`.
3. Update root scripts to start both modules.
4. Promote shared code to a package only when it is actually reused.
