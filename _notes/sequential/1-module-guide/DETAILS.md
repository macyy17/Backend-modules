# Module Writing Guide

This guide explains how to create a backend module that can be copied into any compatible project, wired into that project, migrated, seeded, tested through the module runner server, and then used without dragging half the universe along with it.

A module is intentionally small and portable. It is not a full app. It is a self-contained backend feature package with routes, controllers, database migrations, seeders, docs, and machine-readable endpoint metadata.

## What a Module Is

A module is a directory under `modules/`.

Example:

```txt
modules/translator/
````

A module contains:

```txt
MODULEINFO.md
moduleinfo.json
README.md
routes/
controllers/
db/
```

At minimum, a complete module should provide:

```txt
modules/<module-name>/
  README.md
  MODULEINFO.md
  moduleinfo.json
  routes/
    index.ts
  controllers/
    <FeatureController>.ts
  db/
    migrations/
      001_<description>.sql
    seeders/
      001_<description>.sql
```

Optional folders may be added when the module needs them:

```txt
services/
repositories/
core/
types/
samples/
tests/
```

Do not create vague junk drawers like:

```txt
utils/
helpers/
common/
misc/
```

Use responsibility-based names instead. Future humans already have enough reasons to suffer.

## Module Goals

A module must be:

1. **Portable**
   It can be copied into another backend project.

2. **Understandable**
   `README.md`, `MODULEINFO.md`, and `moduleinfo.json` explain how to use it.

3. **Runnable in isolation**
   The module runner server can load it and expose its routes for testing.

4. **Database-ready**
   Migrations and seeders are included when the module needs database tables or sample data.

5. **TypeScript-first**
   Routes, controllers, services, and repositories should be written in TypeScript.

6. **Small and focused**
   One module should do one bounded backend job.

## Required Files

### `README.md`

Human setup guide for developers copying the module into another project.

It should explain:

* what the module does
* required environment variables
* database setup
* how to run migrations
* how to run seeders
* how to register routes in a host project
* example requests
* expected responses

The README can be longer than `MODULEINFO.md`.

### `MODULEINFO.md`

Compact human-readable module summary for the module runner `/moduleinfo` page.

It should include:

* module name
* short purpose
* endpoint table
* request examples
* response examples
* database tables used
* required environment variables
* notes or limitations

Keep it short and practical.

### `moduleinfo.json`

Machine-readable endpoint metadata used by the module runner `/app`.

It drives preset request cards in the browser tester.

Required shape:

```json
{
  "name": "translator",
  "title": "Translator",
  "description": "Translate text between languages.",
  "endpoints": [
    {
      "id": "translate-text",
      "method": "POST",
      "path": "/translate",
      "title": "Translate Text",
      "description": "Translate text from one language to another.",
      "headers": {},
      "cookies": {},
      "query": {},
      "body": {
        "text": "Hello world",
        "from": "en",
        "to": "ur"
      },
      "response": {
        "translatedText": "ہیلو ورلڈ",
        "from": "en",
        "to": "ur"
      }
    }
  ]
}
```

The module runner accepts `path` or `url`, but use `path` for consistency.

Each endpoint should include:

| Field         | Required | Purpose                         |
| ------------- | -------- | ------------------------------- |
| `id`          | Yes      | Stable endpoint id              |
| `method`      | Yes      | HTTP method                     |
| `path`        | Yes      | Endpoint path starting with `/` |
| `title`       | Yes      | Human-friendly title            |
| `description` | Yes      | Short explanation               |
| `headers`     | Yes      | Example headers                 |
| `cookies`     | Yes      | Example cookies                 |
| `query`       | Yes      | Example query params            |
| `body`        | Yes      | Example request body            |
| `response`    | Yes      | Example response body           |

Use empty objects when not needed:

```json
{
  "headers": {},
  "cookies": {},
  "query": {}
}
```

Use `null` for no body:

```json
{
  "body": null
}
```

## Required Directory Structure

A normal module should look like this:

```txt
modules/<module-name>/
  README.md
  MODULEINFO.md
  moduleinfo.json

  routes/
    index.ts

  controllers/
    <FeatureController>.ts

  db/
    migrations/
      001_create_<table>.sql
    seeders/
      001_seed_<table>.sql
```

For modules with real business logic, use this expanded layout:

```txt
modules/<module-name>/
  README.md
  MODULEINFO.md
  moduleinfo.json

  routes/
    index.ts

  controllers/
    <FeatureController>.ts

  services/
    <FeatureService>.ts

  repositories/
    <FeatureRepository>.ts

  core/
    <pure-domain-files>.ts

  types/
    <FeatureTypes>.ts

  db/
    migrations/
      001_create_<table>.sql
    seeders/
      001_seed_<table>.sql

  samples/
    requests.json
    responses.json

  tests/
    <feature>.test.ts
```

## Layer Rules

Use simple dependency direction:

```txt
routes -> controllers -> services -> repositories -> database
services -> core
repositories -> database
```

Allowed responsibilities:

| Folder           | Responsibility                                  |
| ---------------- | ----------------------------------------------- |
| `routes/`        | Register HTTP endpoints                         |
| `controllers/`   | Validate request, call service, shape response  |
| `services/`      | Application/business workflow                   |
| `repositories/`  | Database access                                 |
| `core/`          | Pure domain logic, no DB, no HTTP, no env       |
| `types/`         | Shared TypeScript request/response/domain types |
| `db/migrations/` | SQL schema changes                              |
| `db/seeders/`    | SQL seed data                                   |
| `samples/`       | Example payloads                                |
| `tests/`         | Module tests                                    |

Do not let lower layers import higher layers.

Bad:

```ts
// core/Translator.ts
import { TranslatorService } from '../services/TranslatorService';
```

Good:

```ts
// services/TranslatorService.ts
import { normalize_language_code } from '../core/normalizeLanguageCode';
```

## Naming Rules

Use clear names based on responsibility.

### Files

| Folder          | File naming                           |
| --------------- | ------------------------------------- |
| `controllers/`  | `TranslatorController.ts`             |
| `services/`     | `TranslatorService.ts`                |
| `repositories/` | `TranslatorRepository.ts`             |
| `routes/`       | `index.ts`                            |
| `types/`        | `TranslatorTypes.ts`                  |
| `core/`         | specific pure function or domain name |

Avoid:

```txt
helper.ts
utils.ts
common.ts
manager.ts
data.ts
stuff.ts
```

### Symbols

Use these conventions:

| Symbol     | Style         |
| ---------- | ------------- |
| Types      | `CapitalCase` |
| Interfaces | `CapitalCase` |
| Classes    | `CapitalCase` |
| Functions  | `snake_case`  |
| Variables  | `snake_case`  |
| Constants  | `UPPER_CASE`  |

Examples:

```ts
export type TranslateRequest = {
  text: string;
  from: string;
  to: string;
};

export class TranslatorController {
  async translate(request: ModuleRequest): Promise<ModuleHandlerResult> {
    // ...
  }
}

export function normalize_language_code(value: string): string {
  return value.trim().toLowerCase();
}
```

## Route Contract for the Module Runner

The module runner loads route files from these possible locations:

```txt
routes/index.ts
routes.ts
index.ts
routes/index.js
routes/index.cjs
routes.js
index.js
```

For TypeScript modules, prefer:

```txt
routes/index.ts
```

A route file can register routes in three supported ways.

### Preferred: Export `registerRoutes`

```ts
import type { ModuleRegisterContext } from '../../../server/src/types';

export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  context.addRoute('POST', '/translate', async (request) => {
    return {
      status: 200,
      body: {
        translatedText: 'example'
      }
    };
  }, {
    description: 'Translate text from one language to another.'
  });
}
```

### Supported: Export `routes`

```ts
import type { ModuleRoute } from '../../../server/src/types';

export const routes: ModuleRoute[] = [
  {
    method: 'POST',
    path: '/translate',
    description: 'Translate text from one language to another.',
    async handler(request) {
      return {
        status: 200,
        body: {
          translatedText: 'example'
        }
      };
    }
  }
];
```

### Supported: Default Export Array

```ts
export default [
  {
    method: 'GET',
    path: '/health',
    description: 'Check module health.',
    handler() {
      return {
        status: 200,
        body: {
          ok: true
        }
      };
    }
  }
];
```

Use `registerRoutes` for new modules because it gives access to the full runner context.

## Module Request Shape

Each route handler receives a `request` object.

```ts
type ModuleRequest = {
  method: string;
  path: string;
  headers: Record<string, unknown>;
  cookies: Record<string, unknown>;
  query: Record<string, unknown>;
  body: unknown;
  rawBody: string;
  params: Record<string, string>;
  database: DatabaseService;
  databaseUrl: string;
};
```

Important fields:

| Field                 | Purpose                              |
| --------------------- | ------------------------------------ |
| `request.params`      | Path params like `/translations/:id` |
| `request.query`       | Query string values                  |
| `request.body`        | Parsed JSON body                     |
| `request.headers`     | HTTP headers                         |
| `request.cookies`     | Parsed cookies                       |
| `request.database`    | PostgreSQL query helper              |
| `request.databaseUrl` | Database connection string           |

## Module Response Shape

A handler can return:

```ts
{
  status: 200,
  headers: {
    'x-example': 'value'
  },
  body: {
    ok: true
  }
}
```

The runner will serialize objects as JSON.

Use this shape:

```ts
type ModuleHandlerResult = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};
```

If `status` is omitted, the runner treats it as success.

Prefer explicit status codes anyway, because future readers are not mind readers.

## Path Params

Route paths can include params:

```ts
context.addRoute('GET', '/translations/:id', async (request) => {
  return {
    status: 200,
    body: {
      id: request.params.id
    }
  };
});
```

Supported:

```txt
/translations/:id
/users/:user_id/messages/:message_id
```

Not supported in the simple runner:

```txt
/files/*
/users/:id?
/regex-routes
```

Keep module routes simple and portable.

## HTTP Method Rules

Use standard HTTP semantics:

| Action                        | Method   |
| ----------------------------- | -------- |
| Read data                     | `GET`    |
| Create data or perform action | `POST`   |
| Replace full resource         | `PUT`    |
| Update part of resource       | `PATCH`  |
| Delete resource               | `DELETE` |

Do not mutate data in `GET` requests.

Bad:

```txt
GET /translate-and-save
```

Good:

```txt
POST /translations
```

## Status Code Rules

Use these common status codes:

| Outcome                 | Status |
| ----------------------- | ------ |
| Success with body       | `200`  |
| Created                 | `201`  |
| Success with no body    | `204`  |
| Bad request             | `400`  |
| Missing or invalid auth | `401`  |
| Forbidden               | `403`  |
| Not found               | `404`  |
| Conflict                | `409`  |
| Validation failed       | `422`  |
| Server error            | `500`  |
| Dependency unavailable  | `503`  |

Never return `200` with an error payload.

Bad:

```json
{
  "ok": false,
  "error": "Text is required"
}
```

with HTTP `200`.

Good:

```ts
return {
  status: 422,
  body: {
    error: {
      code: 'TEXT_REQUIRED',
      message: 'Text is required.',
      details: {}
    }
  }
};
```

## Error Envelope

All module errors should use this shape:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request body is invalid.",
    "details": {}
  }
}
```

Rules:

* `code` is stable and machine-readable.
* `message` is safe for users.
* `details` contains field-level context when useful.
* never expose stack traces
* never expose environment variables
* never expose database connection strings

Example:

```ts
return {
  status: 422,
  body: {
    error: {
      code: 'INVALID_LANGUAGE',
      message: 'The target language is not supported.',
      details: {
        field: 'to'
      }
    }
  }
};
```

## Validation Rules

Validate inputs at the controller boundary.

For simple modules, manual validation is fine:

```ts
type TranslateRequest = {
  text: string;
  from: string;
  to: string;
};

function parse_translate_request(body: unknown): TranslateRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object.');
  }

  const value = body as Record<string, unknown>;

  if (typeof value.text !== 'string' || !value.text.trim()) {
    throw new Error('Text is required.');
  }

  if (typeof value.from !== 'string' || !value.from.trim()) {
    throw new Error('Source language is required.');
  }

  if (typeof value.to !== 'string' || !value.to.trim()) {
    throw new Error('Target language is required.');
  }

  return {
    text: value.text,
    from: value.from,
    to: value.to
  };
}
```

For larger modules, a validation library may be used by the host project, but do not force one unless needed.

A portable module should avoid unnecessary dependencies.

## Controller Rules

Controllers should:

* validate request input
* call a service
* map service result to HTTP response
* return stable error envelopes

Controllers should not:

* register routes
* contain SQL
* contain long business workflows
* read environment variables directly
* leak stack traces

Example:

```ts
import type { ModuleHandlerResult, ModuleRequest } from '../../../server/src/types';
import { TranslatorService } from '../services/TranslatorService';
import type { TranslateRequest } from '../types/TranslatorTypes';

function parse_translate_request(body: unknown): TranslateRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object.');
  }

  const value = body as Record<string, unknown>;

  if (typeof value.text !== 'string' || !value.text.trim()) {
    throw new Error('Text is required.');
  }

  if (typeof value.from !== 'string' || !value.from.trim()) {
    throw new Error('Source language is required.');
  }

  if (typeof value.to !== 'string' || !value.to.trim()) {
    throw new Error('Target language is required.');
  }

  return {
    text: value.text,
    from: value.from,
    to: value.to
  };
}

export class TranslatorController {
  constructor(private readonly translator_service: TranslatorService) {}

  async translate(request: ModuleRequest): Promise<ModuleHandlerResult> {
    let payload: TranslateRequest;

    try {
      payload = parse_translate_request(request.body);
    } catch (error) {
      return {
        status: 422,
        body: {
          error: {
            code: 'VALIDATION_FAILED',
            message: error instanceof Error ? error.message : 'Invalid request.',
            details: {}
          }
        }
      };
    }

    const result = await this.translator_service.translate(payload);

    return {
      status: 200,
      body: result
    };
  }
}
```

## Service Rules

Services should contain application logic.

Services may:

* coordinate repositories
* call pure domain functions
* apply business rules
* return typed results

Services should not:

* know about HTTP details
* read `request.body`
* return HTTP status codes
* directly format API error envelopes

Example:

```ts
import type { TranslateRequest, TranslateResponse } from '../types/TranslatorTypes';
import { normalize_language_code } from '../core/normalizeLanguageCode';

export class TranslatorService {
  async translate(payload: TranslateRequest): Promise<TranslateResponse> {
    const from = normalize_language_code(payload.from);
    const to = normalize_language_code(payload.to);

    return {
      translatedText: payload.text,
      from,
      to
    };
  }
}
```

## Repository Rules

Repositories handle database access.

Use parameterized SQL. Do not build SQL by concatenating request values.

Bad:

```ts
const sql = `SELECT * FROM translations WHERE id = '${request.params.id}'`;
```

Good:

```ts
const result = await database.query(
  'SELECT * FROM translations WHERE id = $1',
  [translation_id]
);
```

Example:

```ts
import type { DatabaseService } from '../../../server/src/types';

export class TranslatorRepository {
  constructor(private readonly database: DatabaseService) {}

  async save_translation(input: {
    source_text: string;
    translated_text: string;
    source_language: string;
    target_language: string;
  }): Promise<{ id: string }> {
    const result = await this.database.query<{ id: string }>(
      `
      INSERT INTO translations (
        source_text,
        translated_text,
        source_language,
        target_language
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [
        input.source_text,
        input.translated_text,
        input.source_language,
        input.target_language
      ]
    );

    return result.rows[0];
  }
}
```

## Database Rules

If a module needs database tables, include SQL migrations and seeders.

Use:

```txt
db/migrations/
db/seeders/
```

Migration names:

```txt
001_create_translations.sql
002_add_translation_status.sql
```

Seeder names:

```txt
001_seed_translation_languages.sql
```

Migration files should be safe to run once. Prefer explicit schema.

Example migration:

```sql
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

If the migration uses PostgreSQL extensions, include them:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Example seeder:

```sql
INSERT INTO translation_languages (code, name)
VALUES
  ('en', 'English'),
  ('ur', 'Urdu')
ON CONFLICT (code) DO NOTHING;
```

## Environment Variables

A portable module should document every environment variable it needs.

Example:

```txt
TRANSLATOR_PROVIDER=local
TRANSLATOR_API_KEY=<optional>
```

Rules:

* never hardcode secrets
* never commit real API keys
* never expose env values in responses
* document defaults when defaults exist

For database access in the module runner, the runner provides:

```txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/module_runner
```

The module should use the provided `request.database` or `context.database` instead of creating its own PostgreSQL pool unless there is a strong reason.

## Route Registration Example

Recommended full route file:

```ts
import { TranslatorController } from '../controllers/TranslatorController';
import { TranslatorService } from '../services/TranslatorService';
import type { ModuleRegisterContext } from '../../../server/src/types';

export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  const translator_service = new TranslatorService();
  const translator_controller = new TranslatorController(translator_service);

  context.addRoute(
    'POST',
    '/translate',
    translator_controller.translate.bind(translator_controller),
    {
      description: 'Translate text from one language to another.'
    }
  );

  context.addRoute(
    'GET',
    '/translator/health',
    async () => ({
      status: 200,
      body: {
        ok: true,
        module: context.selectedModule.name
      }
    }),
    {
      description: 'Check translator module health.'
    }
  );
}
```

## Type Definitions Example

Create a module-specific type file:

```txt
types/TranslatorTypes.ts
```

Example:

```ts
export type TranslateRequest = {
  text: string;
  from: string;
  to: string;
};

export type TranslateResponse = {
  translatedText: string;
  from: string;
  to: string;
};

export type TranslationRecord = {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
};
```

## `MODULEINFO.md` Template

Use this template:

````md
# Translator Module

Translate text between supported languages.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| POST | `/translate` | Translate text from one language to another. |
| GET | `/translator/health` | Check module health. |

## POST `/translate`

### Request

```json
{
  "text": "Hello world",
  "from": "en",
  "to": "ur"
}
````

### Response

```json
{
  "translatedText": "ہیلو ورلڈ",
  "from": "en",
  "to": "ur"
}
```

## Database

This module uses:

```txt
translations
```

Run migrations from:

```txt
db/migrations/
```

Run seeders from:

```txt
db/seeders/
```

## Environment Variables

No required environment variables for local mode.

````

## `README.md` Template

Use this template:

```md
# Translator Module

## Purpose

The translator module provides endpoints for translating text.

## Copy Into a Project

Copy this directory into the host project's modules folder:

```txt
modules/translator
````

## Install Requirements

This module is TypeScript-first and expects the host project to support TypeScript route/controller files.

## Database Setup

Run migrations:

```bash
psql "$DATABASE_URL" -f modules/translator/db/migrations/001_create_translations.sql
```

Run seeders:

```bash
psql "$DATABASE_URL" -f modules/translator/db/seeders/001_seed_translation_languages.sql
```

## Register Routes

Import and register module routes from:

```ts
modules/translator/routes/index.ts
```

## Endpoints

See `MODULEINFO.md` or `moduleinfo.json`.

## Test With Module Runner

From the repo root:

```bash
cd server
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/module_runner npm run dev
```

Open:

```txt
http://localhost:3399/moduleinfo
http://localhost:3399/app
```

````

## `moduleinfo.json` Template

Use this template:

```json
{
  "name": "translator",
  "title": "Translator",
  "description": "Translate text between supported languages.",
  "endpoints": [
    {
      "id": "translate-text",
      "method": "POST",
      "path": "/translate",
      "title": "Translate Text",
      "description": "Translate text from one language to another.",
      "headers": {
        "content-type": "application/json"
      },
      "cookies": {},
      "query": {},
      "body": {
        "text": "Hello world",
        "from": "en",
        "to": "ur"
      },
      "response": {
        "translatedText": "ہیلو ورلڈ",
        "from": "en",
        "to": "ur"
      }
    },
    {
      "id": "translator-health",
      "method": "GET",
      "path": "/translator/health",
      "title": "Translator Health",
      "description": "Check translator module health.",
      "headers": {},
      "cookies": {},
      "query": {},
      "body": null,
      "response": {
        "ok": true,
        "module": "translator"
      }
    }
  ]
}
````

## Testing With the Module Runner

Start PostgreSQL first.

Default module runner database:

```txt
postgresql://postgres:postgres@localhost:5432/module_runner
```

Start the runner:

```bash
cd server
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/module_runner npm run dev
```

Or choose a module without interactive selection:

```bash
cd server
MODULE=translator DATABASE_URL=postgresql://postgres:postgres@localhost:5432/module_runner npm run dev
```

Open:

```txt
http://localhost:3399/moduleinfo
http://localhost:3399/app
http://localhost:3399/db/health
```

Expected DB health:

```json
{
  "ok": true,
  "message": "PostgreSQL connection succeeded."
}
```

## Running Migrations

The module runner currently provides database access, but migration execution is still a developer step.

Run migrations manually:

```bash
psql "postgresql://postgres:postgres@localhost:5432/module_runner" \
  -f modules/translator/db/migrations/001_create_translations.sql
```

Run seeders manually:

```bash
psql "postgresql://postgres:postgres@localhost:5432/module_runner" \
  -f modules/translator/db/seeders/001_seed_translation_languages.sql
```

Modules should document this in their own `README.md`.

## Example Complete Module

Example file tree:

```txt
modules/translator/
  README.md
  MODULEINFO.md
  moduleinfo.json

  routes/
    index.ts

  controllers/
    TranslatorController.ts

  services/
    TranslatorService.ts

  repositories/
    TranslatorRepository.ts

  core/
    normalizeLanguageCode.ts

  types/
    TranslatorTypes.ts

  db/
    migrations/
      001_create_translations.sql
    seeders/
      001_seed_translation_languages.sql
```

Example `core/normalizeLanguageCode.ts`:

```ts
export function normalize_language_code(value: string): string {
  return value.trim().toLowerCase();
}
```

Example `services/TranslatorService.ts`:

```ts
import { normalize_language_code } from '../core/normalizeLanguageCode';
import type { TranslateRequest, TranslateResponse } from '../types/TranslatorTypes';

export class TranslatorService {
  async translate(payload: TranslateRequest): Promise<TranslateResponse> {
    return {
      translatedText: payload.text,
      from: normalize_language_code(payload.from),
      to: normalize_language_code(payload.to)
    };
  }
}
```

Example `controllers/TranslatorController.ts`:

```ts
import type { ModuleHandlerResult, ModuleRequest } from '../../../server/src/types';
import { TranslatorService } from '../services/TranslatorService';
import type { TranslateRequest } from '../types/TranslatorTypes';

function parse_translate_request(body: unknown): TranslateRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be an object.');
  }

  const value = body as Record<string, unknown>;

  if (typeof value.text !== 'string' || !value.text.trim()) {
    throw new Error('Text is required.');
  }

  if (typeof value.from !== 'string' || !value.from.trim()) {
    throw new Error('Source language is required.');
  }

  if (typeof value.to !== 'string' || !value.to.trim()) {
    throw new Error('Target language is required.');
  }

  return {
    text: value.text,
    from: value.from,
    to: value.to
  };
}

export class TranslatorController {
  constructor(private readonly translator_service: TranslatorService) {}

  async translate(request: ModuleRequest): Promise<ModuleHandlerResult> {
    let payload: TranslateRequest;

    try {
      payload = parse_translate_request(request.body);
    } catch (error) {
      return {
        status: 422,
        body: {
          error: {
            code: 'VALIDATION_FAILED',
            message: error instanceof Error ? error.message : 'Invalid request.',
            details: {}
          }
        }
      };
    }

    const response = await this.translator_service.translate(payload);

    return {
      status: 200,
      body: response
    };
  }
}
```

Example `routes/index.ts`:

```ts
import type { ModuleRegisterContext } from '../../../server/src/types';
import { TranslatorController } from '../controllers/TranslatorController';
import { TranslatorService } from '../services/TranslatorService';

export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  const translator_service = new TranslatorService();
  const translator_controller = new TranslatorController(translator_service);

  context.addRoute(
    'POST',
    '/translate',
    translator_controller.translate.bind(translator_controller),
    {
      description: 'Translate text from one language to another.'
    }
  );

  context.addRoute(
    'GET',
    '/translator/health',
    async () => ({
      status: 200,
      body: {
        ok: true,
        module: context.selectedModule.name
      }
    }),
    {
      description: 'Check translator module health.'
    }
  );
}
```

## Security Rules

Modules must not:

* hardcode secrets
* leak stack traces
* return environment values
* return database URLs
* concatenate SQL with request input
* mutate data in `GET` handlers
* return `200` for error cases

Use parameterized SQL for every database query.

Use safe user-facing error messages.

## Portability Rules

A module should avoid unnecessary package dependencies.

Prefer:

* TypeScript
* simple classes
* plain SQL migrations
* small functions
* clear docs

Avoid:

* framework-specific decorators
* hidden global state
* hardcoded project paths
* host app assumptions
* importing from sibling modules
* starting its own HTTP server

A module should be copyable. That is the entire point. Shocking, I know.

## Checklist Before Calling a Module Complete

A module is complete when:

* [ ] `README.md` explains setup and usage.
* [ ] `MODULEINFO.md` gives compact endpoint docs.
* [ ] `moduleinfo.json` lists all endpoints for `/app`.
* [ ] `routes/index.ts` registers every endpoint.
* [ ] controllers validate request input.
* [ ] services contain business logic.
* [ ] repositories contain database access, if needed.
* [ ] migrations exist for every table the module needs.
* [ ] seeders exist when sample/default data is needed.
* [ ] all SQL using request data is parameterized.
* [ ] error responses use the stable error envelope.
* [ ] no stack traces or secrets are returned.
* [ ] `GET` endpoints do not mutate data.
* [ ] the module runs in the module runner.
* [ ] `/moduleinfo` renders useful docs.
* [ ] `/app` presets are loaded from `moduleinfo.json`.
* [ ] `/db/health` succeeds when the module needs database access.

## Recommended Build Order

When creating a new module, work in this order:

1. Create the module directory.
2. Write `README.md`.
3. Write `MODULEINFO.md`.
4. Write `moduleinfo.json`.
5. Add database migrations.
6. Add database seeders.
7. Add types.
8. Add core pure functions.
9. Add repositories, if needed.
10. Add services.
11. Add controllers.
12. Add routes.
13. Run migrations and seeders.
14. Start the module runner.
15. Test endpoints in `/app`.
16. Fix docs and metadata after testing.

Docs first, then code. Otherwise the module becomes a haunted cave where only the original author knows which rock opens the door.

## Minimal Module Acceptance Test

For a module named `translator`, this should work:

```bash
cd server
MODULE=translator DATABASE_URL=postgresql://postgres:postgres@localhost:5432/module_runner npm run dev
```

Then verify:

```txt
GET /moduleinfo
GET /app
GET /db/health
```

The route list should appear in:

```txt
GET /runner/config
```

Example:

```json
{
  "module": "translator",
  "port": 3399,
  "databaseUrl": "postgresql://postgres:****@localhost:5432/module_runner",
  "moduleRoutes": [
    {
      "method": "POST",
      "path": "/translate",
      "description": "Translate text from one language to another."
    }
  ]
}
```

The endpoint should be callable from `/app`.

## Common Mistakes

| Mistake                                 | Fix                                                       |
| --------------------------------------- | --------------------------------------------------------- |
| Empty `moduleinfo.json`                 | Add endpoint metadata                                     |
| Route exists but not shown in runner    | Export `registerRoutes`, `routes`, or default route array |
| Handler crashes on bad body             | Validate body before using it                             |
| SQL string uses request values directly | Use `$1`, `$2`, etc.                                      |
| `GET` endpoint inserts data             | Change it to `POST`                                       |
| `MODULEINFO.md` is too long             | Keep details in `README.md`                               |
| `README.md` has no migration steps      | Add exact `psql` commands                                 |
| Controller contains SQL                 | Move SQL into repository                                  |
| Service returns HTTP status             | Return domain result, map HTTP in controller              |
| Module imports sibling module           | Extract shared code or duplicate small pure logic         |

## Final Rule

A module should be boring to install, boring to test, and boring to copy.

Boring backend modules are good. Exciting backend modules usually mean someone is about to lose a weekend.

## Database Lifecycle Commands

Run lifecycle commands from `server/`.

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
```

Run one module only:

```bash
npm run db:migrate -- --module <module-name>
npm run db:seed -- --module <module-name>
npm run db:reset -- --module <module-name>
```

The runner scans:

```txt
modules/<module-name>/db/migrations/*.sql
modules/<module-name>/db/seeders/*.sql
modules/<module-name>/db/reset/*.sql
```

Migration and seeder files are tracked in `module_runner_db_history` and skipped after they run once.

Use `--force` to rerun recorded files:

```bash
npm run db:migrate -- --module <module-name> --force
npm run db:seed -- --module <module-name> --force
```

Use `--refresh` with migrations to run reset SQL, clear lifecycle history for that module, and rerun migrations:

```bash
npm run db:migrate -- --module <module-name> --refresh
```

Use `db:reset` for a full local rebuild: reset SQL, migrations, then seeders.

```bash
npm run db:reset -- --module <module-name>
```

