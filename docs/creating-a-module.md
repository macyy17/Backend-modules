# Creating a Module

A module is a portable backend feature package under `modules/`.

It is not a full app. It should not start its own HTTP server. The module runner starts the server and gives the selected module routes, env, and database access.

## Basic Structure

Create a module directory:

```txt
modules/<module-name>/
```

Required files:

```txt
modules/<module-name>/
  README.md
  MODULEINFO.md
  moduleinfo.json
  .env.example
  routes/
    index.ts
  controllers/
    <FeatureController>.ts
  services/
    <FeatureService>.ts
  types/
    <FeatureTypes>.ts
```

Optional folders:

```txt
repositories/
core/
db/
  migrations/
  seeders/
samples/
tests/
```

Use optional folders only when the module actually needs them.

## Environment Files

Every module can have its own env template:

```txt
modules/<module-name>/.env.example
```

Developers copy it to:

```txt
modules/<module-name>/.env
```

Module-specific values should live in the module env file:

```txt
modules/<module-name>/.env
```

Examples:

```txt
GROQ_API_KEY
STRIPE_API_KEY
OPENAI_API_KEY
TRANSLATOR_PROVIDER
FEATURE_FLAG_NAME
```

Database values can also live in the module env file.

The runner loads module env only after the module is selected, so each module can carry its own local config.

## Env Precedence

Env loading order:

```txt
root .env
server/.env
modules/<selected-module>/.env
shell runner overrides
```

Later values win.

Shell runner overrides are reserved for runner controls and database override values:

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

This keeps the runner generic while still letting you override the selected module, port, or DB connection from the command line.

## Required Docs

### `README.md`

Full developer guide.

Include:

- purpose
- env setup
- endpoint examples
- database setup, if any
- how to run with the module runner

### `MODULEINFO.md`

Compact module summary for `/moduleinfo`.

Include:

- module purpose
- endpoint table
- input fields
- example requests
- example responses
- env requirements
- database notes

### `moduleinfo.json`

Machine-readable endpoint presets for `/app`.

Example:

```json
{
  "name": "translator",
  "title": "Translator",
  "description": "Translate text between languages.",
  "endpoints": [
    {
      "id": "translate-post",
      "method": "POST",
      "path": "/translate",
      "title": "Translate Text",
      "description": "Translate text using JSON body fields: text, from, and to.",
      "headers": {
        "content-type": "application/json"
      },
      "cookies": {},
      "query": {},
      "body": {
        "text": "Good morning",
        "from": "English",
        "to": "Spanish"
      },
      "response": {
        "translatedText": "Buenos días",
        "from": "English",
        "to": "Spanish"
      }
    }
  ]
}
```

## Route Contract

Preferred route file:

```txt
modules/<module-name>/routes/index.ts
```

Preferred route registration:

```ts
import type { ModuleRegisterContext } from '../../../server/src/types';
import { ExampleController } from '../controllers/ExampleController.js';
import { ExampleService } from '../services/ExampleService.js';

export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  const service = new ExampleService();
  const controller = new ExampleController(service);

  context.addRoute(
    'POST',
    '/example',
    controller.create.bind(controller),
    { description: 'Create an example.' }
  );
}
```

The route handler receives a `ModuleRequest`.

Important fields:

```ts
request.method
request.path
request.headers
request.cookies
request.query
request.body
request.rawBody
request.params
request.database
request.databaseUrl
```

Return a module result:

```ts
return {
  status: 200,
  body: {
    ok: true
  }
};
```

## Layer Rules

Use this dependency direction:

```txt
routes -> controllers -> services -> repositories -> database
services -> core
```

Responsibilities:

| Folder | Responsibility |
| --- | --- |
| `routes/` | Register HTTP endpoints |
| `controllers/` | Validate request input and shape HTTP responses |
| `services/` | Application workflow and business logic |
| `repositories/` | Database queries |
| `core/` | Pure functions with no HTTP, DB, or env access |
| `types/` | Shared TypeScript types |
| `db/migrations/` | SQL schema changes |
| `db/seeders/` | SQL seed data |

## Naming Rules

Use clear names:

```txt
TranslatorController.ts
TranslatorService.ts
TranslatorRepository.ts
TranslatorTypes.ts
normalizeLanguageCode.ts
```

Avoid vague names:

```txt
utils.ts
helpers.ts
common.ts
manager.ts
stuff.ts
```

Types and classes use `CapitalCase`.

Functions and variables use `snake_case`.

## Validation

Validate request input in the controller.

Example:

```ts
function parse_body(body: unknown): { text: string } {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object.');
  }

  const value = body as Record<string, unknown>;

  if (typeof value.text !== 'string' || !value.text.trim()) {
    throw new Error('Text is required.');
  }

  return { text: value.text };
}
```

## Error Shape

Use this shape for module errors:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Text is required.",
    "details": {}
  }
}
```

Do not return `200` for errors.

## Database Access

Use the runner-provided database service:

```ts
const result = await request.database.query(
  'select * from translations where id = $1',
  [translation_id]
);
```

Always parameterize SQL.

## Migrations and Seeders

If the module needs tables, add:

```txt
db/migrations/
db/seeders/
```

Run manually for now:

```bash
psql "$DATABASE_URL" -f modules/<module-name>/db/migrations/001_create_table.sql
```

## Testing Checklist

Start the runner:

```bash
cd server
MODULE=<module-name> npm run dev
```

Check config:

```bash
curl http://localhost:<PORT>/runner/config
```

Confirm:

- `module` is correct
- `moduleEnvLoaded` is `true` when the module has `.env`
- expected routes are listed
- database URL is masked

Check database:

```bash
curl http://localhost:<PORT>/db/health
```

Test endpoints from:

```txt
http://localhost:<PORT>/app
```

## Completion Checklist

A module is done when:

- [ ] `README.md` explains setup and usage.
- [ ] `MODULEINFO.md` renders useful docs.
- [ ] `moduleinfo.json` has endpoint presets.
- [ ] `.env.example` documents required env vars.
- [ ] real `.env` is ignored by git.
- [ ] `routes/index.ts` registers every endpoint.
- [ ] controllers validate input.
- [ ] services contain workflow logic.
- [ ] repositories use parameterized SQL, if any.
- [ ] migrations and seeders exist, if the module needs DB tables.
- [ ] `/runner/config` shows expected routes.
- [ ] `/db/health` passes when DB is required.
- [ ] endpoint calls pass through `/app` or curl.

## Database Lifecycle

When a module owns database tables, add SQL files under:

```txt
db/migrations/
db/seeders/
db/reset/
```

Run from `server/`:

```bash
npm run db:migrate -- --module <module-name>
npm run db:seed -- --module <module-name>
npm run db:reset -- --module <module-name>
```

`db:migrate` and `db:seed` track executed files and skip already-applied SQL.

Use `--force` to rerun recorded files:

```bash
npm run db:migrate -- --module <module-name> --force
npm run db:seed -- --module <module-name> --force
```

Use `--refresh` with migrations to run reset SQL, clear that module's lifecycle history, and rerun migrations:

```bash
npm run db:migrate -- --module <module-name> --refresh
```

