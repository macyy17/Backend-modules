# Module Runner Server

Interactive local server for selecting and testing modules from `../modules`.

## Usage

```bash
cd server
npm run dev
```

The runner scans `../modules`, lets you select a module with arrow keys and Enter, then starts a local HTTP server.

Useful URLs after startup:

- `/moduleinfo` renders the selected module's `MODULEINFO.md`.
- `/app` opens a small Postman-like request sender.
- `/app/presets` returns endpoint presets from `moduleinfo.json`.
- `/app/request` sends raw test requests through the runner.

## Optional environment variables

- `MODULE=<module-name>` skips the interactive selector.
- `PORT=3333` changes the server port.

## Module metadata

The runner accepts empty `MODULEINFO.md` and empty `moduleinfo.json` so early modules can still be tested. A useful `moduleinfo.json` looks like this:

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
      }
    }
  ]
}
```

## Module routes

If a module has route files, the runner tries these paths:

- `routes/index.js`
- `routes/index.cjs`
- `routes.js`
- `index.js`

Supported exports:

- `registerRoutes(context)` where `context.addRoute(method, path, handler)` registers a route.
- `routes` array with `{ method, path, handler }` entries.

Handler signature:

```js
async function handler(request) {
  return {
    status: 200,
    headers: { "content-type": "application/json" },
    body: { ok: true }
  };
}
```

Request shape:

```js
{
  method,
  path,
  headers,
  cookies,
  query,
  body,
  rawBody,
  params
}
```
