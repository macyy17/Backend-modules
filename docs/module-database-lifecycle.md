# Module Database Lifecycle

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
