# Module Runner Server

The module runner server is a local TypeScript test harness for backend modules in `./modules`.

It is generic. It is not hardcoded to `translator` or any other module. The selected module is chosen either from the interactive terminal picker or through the `MODULE` environment variable.

The runner gives each selected module a local HTTP server with:

```txt
/moduleinfo
/app
/app/presets
/app/request
/runner/config
/db/health
<selected module routes>
```

## Location

```txt
server/
```

Start it from the server directory:

```bash
cd server
npm run dev
```

Or select a module without the interactive picker:

```bash
cd server
MODULE=translator npm run dev
```

## Startup Flow

At startup, the runner:

1. Finds available modules under `modules/`.
2. Selects a module from `MODULE` or from the terminal picker.
3. Loads env files, including the selected module's own `.env`.
4. Creates the PostgreSQL connection from the resolved env.
5. Loads the selected module's route file.
6. Starts the local HTTP server.
7. Exposes docs, app presets, DB health, and module routes.

The runner is a harness, not the module itself.

## Environment Loading

Env files are loaded in this order:

```txt
<repo>/.env
<repo>/server/.env
<repo>/modules/<selected-module>/.env
shell runner overrides
```

Later file values override earlier file values.

Module-specific secrets belong here:

```txt
modules/<module-name>/.env
```

Example:

```txt
modules/translator/.env
```

The runner loads whichever module was selected, then uses that module's `.env`.

## Shell Runner Overrides

These shell variables override file values because they control the runner itself:

```txt
MODULE
PORT
DATABASE_URL
POSTGRES_URL
MODULE_RUNNER_DATABASE_URL
PGUSER
PGPASSWORD
PGHOST
PGPORT
PGDATABASE
```

Example:

```bash
cd server
MODULE=translator PORT=3405 npm run dev
```

Module-specific env values should live in the module's own `.env` file. If a module `.env` defines a value, it wins over root or server `.env` for that module run.

## Database Configuration

The runner creates the PostgreSQL connection after the module is selected and after the module env file is loaded.

This means a module can define its own database connection:

```txt
modules/<module-name>/.env
```

Supported DB env values:

```txt
DATABASE_URL
POSTGRES_URL
MODULE_RUNNER_DATABASE_URL
PGUSER
PGPASSWORD
PGHOST
PGPORT
PGDATABASE
```

The module receives database access through the request context:

```ts
const result = await request.database.query('select 1 as ok');
```

Route registration also receives database access:

```ts
export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  await context.database.health();
}
```

Do not create a new PostgreSQL pool inside a module unless there is a strong reason. The runner already provides one.

## Runner Routes

### `/moduleinfo`

Renders the selected module's `MODULEINFO.md`.

### `/app`

Browser request tester for the selected module. It loads presets from `moduleinfo.json`.

### `/app/presets`

Returns endpoint presets from `moduleinfo.json`.

### `/app/request`

Sends a test request from the browser tester to the selected module route.

### `/runner/config`

Returns safe runner diagnostics.

It includes:

- selected module
- port
- masked database URL
- env file paths loaded
- whether module env was loaded
- registered module routes

It does not expose secret values.

### `/db/health`

Checks the current PostgreSQL connection.

## Route Loading

Preferred route file:

```txt
modules/<module-name>/routes/index.ts
```

Preferred route registration:

```ts
import type { ModuleRegisterContext } from '../../../server/src/types';

export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  context.addRoute('GET', '/health', async () => ({
    status: 200,
    body: { ok: true }
  }));
}
```

## Testing a Module

Example with translator:

```bash
cd server
MODULE=translator npm run dev
```

Then call:

```bash
curl http://localhost:3405/runner/config
curl http://localhost:3405/db/health
curl 'http://localhost:3405/translate?text=Hello%20world&from=auto&to=Urdu'
```

If `/runner/config` shows `moduleEnvLoaded: true`, the selected module's `.env` was loaded.

## Secret Handling

Never commit real `.env` files.

Use `.env.example` files for templates:

```txt
modules/<module-name>/.env.example
```

Real env files are ignored by git through the root `.gitignore` rule:

```txt
.env
```

The runner masks database passwords in diagnostics. It does not print API keys.
