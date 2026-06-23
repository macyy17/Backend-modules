#!/usr/bin/env bash
set -euo pipefail

echo "== repo =="
pwd
test -d server
test -d modules
test -d docs

echo
echo "== fix package scripts =="
node <<'NODE'
const fs = require('node:fs');

const file = 'server/package.json';
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

pkg.scripts = pkg.scripts || {};
pkg.scripts['db:migrate'] = 'tsx src/db/runModuleDatabaseFiles.ts migrate';
pkg.scripts['db:seed'] = 'tsx src/db/runModuleDatabaseFiles.ts seed';
pkg.scripts['db:reset'] = 'tsx src/db/runModuleDatabaseFiles.ts reset';

fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
console.log(pkg.scripts);
NODE

echo
echo "== ensure expense-calculator reset SQL =="
mkdir -p modules/expense-calculator/db/reset
cat > modules/expense-calculator/db/reset/001_drop_expenses.sql <<'SQL'
DROP TABLE IF EXISTS expenses;
SQL
cat modules/expense-calculator/db/reset/001_drop_expenses.sql

echo
echo "== update docs =="
python3 <<'PY'
from pathlib import Path

Path("docs").mkdir(exist_ok=True)

Path("docs/module-database-lifecycle.md").write_text("""# Module Database Lifecycle

The module runner server owns database lifecycle commands for portable modules.

Run from `server/`:

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
```

## Module SQL Layout

A module can provide SQL files here:

```txt
modules/<module-name>/db/migrations/*.sql
modules/<module-name>/db/seeders/*.sql
modules/<module-name>/db/reset/*.sql
```

Files run in sorted filename order.

## Tracking

The runner tracks executed files in:

```txt
module_runner_db_history
```

Migration and seeder files are skipped after they run once.

## Run One Module

```bash
cd server
npm run db:migrate -- --module expense-calculator
npm run db:seed -- --module expense-calculator
```

## Force

```bash
cd server
npm run db:migrate -- --module expense-calculator --force
npm run db:seed -- --module expense-calculator --force
```

## Refresh Migrations

```bash
cd server
npm run db:migrate -- --module expense-calculator --refresh
```

Refresh behavior:

1. Runs `db/reset/*.sql` if present.
2. Clears that module's lifecycle history.
3. Reruns migrations.

## Reset

```bash
cd server
npm run db:reset -- --module expense-calculator
```

Reset behavior:

1. Runs reset SQL.
2. Clears that module's lifecycle history.
3. Reruns migrations.
4. Reruns seeders.

Use reset for local rebuilds. It is destructive for that module's tables.
""")

docs_readme = Path("docs/README.md")
text = docs_readme.read_text() if docs_readme.exists() else "# Backend Modules Documentation\n"
link = "- [Module Database Lifecycle](./module-database-lifecycle.md)"
if link not in text:
    text = text.rstrip() + "\n\n## Documents\n\n" + link + "\n"
docs_readme.write_text(text)

creating = Path("docs/creating-a-module.md")
text = creating.read_text() if creating.exists() else "# Creating a Module\n"
section = """## Database Lifecycle

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
"""
if "## Database Lifecycle" not in text:
    text = text.rstrip() + "\n\n" + section + "\n"
creating.write_text(text)

details = Path("_notes/sequential/1-module-guide/DETAILS.md")
text = details.read_text() if details.exists() else "# Module Writing Guide\n"
section = """## Database Lifecycle Commands

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
"""
if "## Database Lifecycle Commands" not in text:
    text = text.rstrip() + "\n\n" + section + "\n"
details.write_text(text)

print("docs updated")
PY

echo
echo "== build =="
cd server
npm run check
npm run build

echo
echo "== lifecycle test: expense-calculator =="
npm run db:reset -- --module expense-calculator
npm run db:migrate -- --module expense-calculator
npm run db:seed -- --module expense-calculator
npm run db:migrate -- --module expense-calculator --refresh
npm run db:seed -- --module expense-calculator

echo
echo "== runner smoke =="
PORT=3499
MODULE=expense-calculator PORT="$PORT" npm run dev &
PID=$!
sleep 4

node --input-type=module <<'NODE'
const port = 3499;
const base = 'http://' + 'localhost:' + port;

async function get(path) {
  const response = await fetch(base + path);
  const text = await response.text();
  console.log('\nGET ' + path + ' -> ' + response.status);
  console.log(text);
}

await get('/runner/config');
await get('/db/health');
await get('/expenses');
await get('/expenses/total');
NODE

kill "$PID" 2>/dev/null || true
wait "$PID" 2>/dev/null || true

cd ..

echo
echo "== final changed files =="
git status --short

echo
echo "DONE"
