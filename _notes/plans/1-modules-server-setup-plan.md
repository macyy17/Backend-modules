## Plan: Module Runner Server

### Goal

Create a standalone server inside `./server/` with:

```bash
npm run dev
```

When started, it opens an interactive terminal selector where the user chooses a module. After selection, it runs a local test server for that module.

The server should expose:

```txt
/moduleinfo
/app
<selected module endpoints>
```

## Proposed Stack

Use a simple Node/TypeScript Express server.

Why:

* Easy `npm run dev`.
* Easy terminal interaction with `@inquirer/prompts`.
* Easy Markdown rendering for `MODULEINFO.md`.
* Easy static UI for `/app`.
* Easy dynamic route mounting for module routes later.

Suggested dependencies:

```txt
express
@inquirer/prompts
markdown-it
zod
tsx
typescript
```

Optional later:

```txt
cookie-parser
cors
multer
```

Only add these when actually needed. Humanity has suffered enough from dependency hoarding.

## Directory Plan

Create this structure:

```txt
server/
  package.json
  tsconfig.json
  src/
    main.ts
    cli/
      selectModule.ts
    modules/
      discoverModules.ts
      loadModuleInfo.ts
      loadModuleRoutes.ts
      moduleTypes.ts
    http/
      createServer.ts
      routes/
        moduleInfoRoute.ts
        appRoute.ts
        moduleRoutesRoute.ts
    app/
      renderAppPage.ts
      assets/
        app.css
        app.js
```

## Responsibilities

### `src/main.ts`

Entry point.

Flow:

1. Discover available modules from `../modules`.
2. Show interactive selector.
3. Load selected module metadata.
4. Create Express app.
5. Mount runner routes.
6. Mount selected module routes if available.
7. Start server.

Example behavior:

```txt
? Select module:
❯ translator

Running module: translator
Server: http://localhost:3333
Module info: http://localhost:3333/moduleinfo
App tester: http://localhost:3333/app
```

## Module Discovery

### `discoverModules.ts`

Reads `../modules/*`.

A valid module should be a directory with at least:

```txt
MODULEINFO.md
moduleinfo.json
```

Later, once `DETAILS.md` is completed, validation can expand to require:

```txt
routes/
controllers/
db/migrations/
db/seeders/
```

For now, avoid blocking on missing routes/controllers because the current `translator` module directories are empty.

## Module Metadata Loading

### `loadModuleInfo.ts`

Loads:

```txt
MODULEINFO.md
moduleinfo.json
```

Returns:

```ts
type SelectedModule = {
  name: string;
  path: string;
  moduleInfoMarkdown: string;
  moduleInfoJson: ModuleInfoJson;
};
```

Use `zod` to validate `moduleinfo.json`.

Since the current `moduleinfo.json` is empty, the first implementation should tolerate empty files and return:

```ts
{
  endpoints: []
}
```

This keeps the runner usable before the module guide is fully written.

## `/moduleinfo`

### Purpose

Render the selected module’s `MODULEINFO.md` as HTML.

Route:

```txt
GET /moduleinfo
```

Behavior:

* Read Markdown from selected module.
* Render using `markdown-it`.
* Wrap in a simple HTML layout.
* If empty, show a useful placeholder:

```txt
No MODULEINFO.md content found for this module.
```

## `/app`

### Purpose

A browser-based HTTP request tester, like a tiny Postman, but without the cursed bloat.

Route:

```txt
GET /app
```

Interface:

* Method dropdown:

  * `GET`
  * `POST`
  * `PUT`
  * `PATCH`
  * `DELETE`
* URL input.
* Headers editor.
* Cookies editor.
* Query params editor.
* Body editor.
* Send button.
* Response viewer.

Also include a searchable preset picker sourced from `moduleinfo.json`.

## Preset Picker

The `/app` page should load presets from:

```txt
GET /app/module-presets
```

or embedded directly into the HTML at first.

Each preset should show a custom large option card:

```txt
[GET] /translate
Translate text from one language to another
```

Required display fields:

* HTTP method
* URL/path
* Description
* Required params/body fields, if present

When selected:

* Fill method.
* Fill URL.
* Fill sample body/query/headers.
* Show endpoint description.
* Highlight missing fields.

## Raw Request Sender

The frontend should send requests through the runner server, not directly from browser JS, to avoid browser/CORS nonsense. Because naturally, browsers made “send HTTP request” complicated.

Add route:

```txt
POST /app/request
```

Payload:

```ts
type AppRequestPayload = {
  method: string;
  url: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
};
```

Server executes the request against the selected module server/app internally.

Two implementation options:

### Option A: Internal dispatch, preferred later

Mount module routes inside the same Express app and dispatch requests directly.

Good because:

* No child server process.
* Simple testing.
* One port.

### Option B: HTTP proxy, useful if modules are full apps

If a module exposes its own runnable server, start it separately and proxy requests to it.

Good because:

* Works for modules that are complete mini-apps.
* More realistic integration testing.

For first implementation, use **Option A** unless `DETAILS.md` later says modules must run as separate processes.

## Mounting Module Endpoints

Expected future module shape:

```txt
modules/<module-name>/routes/index.ts
modules/<module-name>/controllers/*
```

Runner should attempt to load:

```txt
modules/<module-name>/routes/index.ts
```

Expected export:

```ts
export function registerRoutes(app: Express): void;
```

or:

```ts
export const router: Router;
```

Recommended contract:

```ts
export function createModuleRouter(): Router;
```

Then runner mounts it:

```txt
/
```

or optionally:

```txt
/module
```

The docs should decide this, but I’d plan for root mounting because the runner is testing one selected module at a time.

## `moduleinfo.json` Shape

Use this as the initial expected shape:

```json
{
  "name": "translator",
  "title": "Translator",
  "description": "Translation module.",
  "endpoints": [
    {
      "method": "POST",
      "path": "/translate",
      "description": "Translate text.",
      "headers": {},
      "query": {},
      "body": {
        "text": "Hello",
        "from": "en",
        "to": "ur"
      },
      "response": {
        "translatedText": "..."
      }
    }
  ]
}
```

Server should tolerate missing fields.

## Implementation Phases

### Phase 1: Server bootstrap

Create:

```txt
server/package.json
server/tsconfig.json
server/src/main.ts
```

Add:

```bash
npm run dev
```

Expected result:

```txt
npm run dev
```

starts the interactive selector.

### Phase 2: Module selection

Implement:

```txt
src/modules/discoverModules.ts
src/cli/selectModule.ts
```

Acceptance:

* Lists `translator`.
* Allows arrows and enter.
* Fails clearly if no modules exist.

### Phase 3: `/moduleinfo`

Implement Markdown rendering.

Acceptance:

* `GET /moduleinfo` renders selected module’s Markdown.
* Empty Markdown gives a clean placeholder.

### Phase 4: `/app` static UI

Implement basic request sender UI.

Acceptance:

* User can choose method.
* Enter URL.
* Add headers/query/body.
* Send request.
* See response status/body.

### Phase 5: Presets from `moduleinfo.json`

Implement preset search modal.

Acceptance:

* Reads endpoints from `moduleinfo.json`.
* Search filters by method/path/description.
* Selecting preset fills the request form.

### Phase 6: Module route mounting

Implement dynamic module route loading.

Acceptance:

* If module exports a router, runner mounts it.
* If no routes exist, `/moduleinfo` and `/app` still work.

### Phase 7: Validation and polish

Add:

* Friendly errors.
* Invalid JSON handling.
* Missing file handling.
* Port config.
* Basic request timeout.
* Response formatting.

## Verification

Run:

```bash
cd server
npm install
npm run dev
```

Then verify:

```txt
GET http://localhost:3333/moduleinfo
GET http://localhost:3333/app
```

Also verify:

* Terminal module selector works.
* Empty `MODULEINFO.md` does not crash.
* Empty `moduleinfo.json` does not crash.
* `/app` can submit a request.
* Missing module routes do not crash the runner.

## Important Design Decision

The first version should **not require completed module docs or working module endpoints**.

Reason: the current `translator` module is mostly empty. So the runner should be useful immediately as a harness, then become stricter after `_notes/sequential/1-module-guide/DETAILS.md` is completed.

---

Write `docs/usage.md` that has guide on how to use this module specifically

so that i can provide developer a zip containing module as well as that dir from docs/usage.md and they can use in their project easily.

it should be simple short and to the point.

give me usage.md in chat insetad of writing with EigenMCP

---