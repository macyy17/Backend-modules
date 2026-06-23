# Module Runner Server

Interactive TypeScript server for selecting and testing modules from `../modules`.

## Usage

```bash
cd server
npm install
npm run dev
```

The runner scans `../modules`, lets you select a module with arrow keys and Enter, then starts a local HTTP server.

Useful URLs after startup:

- `/moduleinfo` renders the selected module's `MODULEINFO.md`.
- `/app` opens a small Postman-like request sender.
- `/app/presets` returns endpoint presets from `moduleinfo.json`.
- `/app/request` sends raw test requests through the runner.
- `/db/health` checks PostgreSQL connectivity.
- `/runner/config` shows safe runner config with the DB password masked.

## Environment variables

Create `server/.env` or export variables before running:

```bash
MODULE=translator
PORT=3333
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/module_runner
```

`DATABASE_URL` is the preferred PostgreSQL string. The runner also accepts `POSTGRES_URL` or `MODULE_RUNNER_DATABASE_URL`.

If no connection string is provided, the runner uses:

```txt
postgresql://postgres:postgres@localhost:5432/module_runner
```

Module handlers receive database access in their request object:

```ts
export const routes = [
  {
    method: 'GET',
    path: '/health',
    async handler(request) {
      const result = await request.database.query('select 1 as ok');
      return { status: 200, body: result.rows[0] };
    },
  },
];
```

Route registration files may be TypeScript or JavaScript:

- `routes/index.ts`
- `routes.ts`
- `index.ts`
- `routes/index.js`
- `routes/index.cjs`
- `routes.js`
- `index.js`

Supported exports:

- `registerRoutes(context)` where `context.addRoute(method, path, handler)` registers a route.
- `routes` array with `{ method, path, handler }` entries.
- default function receiving the same context.
- default route array.
