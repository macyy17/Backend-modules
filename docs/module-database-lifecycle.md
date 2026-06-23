# Module Database Lifecycle

The module runner server owns common database lifecycle commands for portable modules.

From `server/`, run:

```bash
npm run db:migrate
npm run db:seed
```

By default, each command scans every module under `../modules` and runs sorted SQL files from:

```txt
modules/<module-name>/db/migrations/*.sql
modules/<module-name>/db/seeders/*.sql
```

To run one module only:

```bash
npm run db:migrate -- --module expense-calculator
npm run db:seed -- --module expense-calculator
```

The runner creates and uses this table:

```txt
module_runner_db_history
```

Once a file is recorded, it is skipped on future runs.

To rerun recorded files intentionally:

```bash
npm run db:migrate -- --module expense-calculator --force
npm run db:seed -- --module expense-calculator --force
```

Typical setup after clone:

```bash
cd server
npm install
npm run db:migrate
npm run db:seed
npm run dev
```
