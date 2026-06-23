# Project Layout

A project separates source, scripts, tests, build output, and docs.

## Root Layout

```txt
/
|- src/             # Source code
|- scripts/         # Shell / operational scripts
|- tests/           # Test files
|- dist/            # Build output (gitignored or per project)
|- data/            # Runtime data (gitignored)
|- logs/            # Runtime logs (gitignored)
|- docs/            # Documentation
|- _notes/          # Private working notes (gitignored)
|- package.json / pyproject.toml
|- .env.example     # Comments-only env documentation
|- .env.dev         # Development defaults
|- .env.prod        # Production defaults
|- .env             # Active runtime config (gitignored)
|- README.md
```

## Source Layout

```txt
src/
|- controllers/
|- routes/
|- middlewares/
|- services/
|- examples/
|- scripts/
|- core/
|- types/
|- interfaces/
|- jobs/
|- queues/
|- events/
|- listeners/
|- workers/
|- database/
|- samples/
|- main.ts (or __main__.py)
```

Create a folder only when the responsibility actually exists.

## Folder Roles

- `controllers/` — handle HTTP request/response flow.
- `routes/` — register paths, attach middlewares; compose nested routers.
- `middlewares/` — reusable request flow (auth, logging, validation).
- `services/` — coordinate app behavior; group by domain (auth, billing).
- `core/` — domain logic and portable utils; no infrastructure imports.
- `types/` / `interfaces/` — shared contracts.
- `jobs/`, `queues/`, `events/`, `listeners/` — async background work.
- `workers/` — CLI entrypoints (`*_worker`).
- `database/` — migrations, seeders, connection setup.
- `samples/` — test-only support code.
- `examples/` — short numbered dev examples (`1-hello.ts`).
- `scripts/` — source helper commands.

## Docs Layout

```txt
docs/
|- README.md
|- developer/
|  |- README.md
|  |- ...topic files...
|- user/
|  |- README.md
|  |- ...topic files...
```

## Build Output

- Build output belongs in `dist/`.
- Source code never imports from `dist/`.
- Tests do not depend on built files unless they test packaging.
