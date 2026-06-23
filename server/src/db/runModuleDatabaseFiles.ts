import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { createDatabase } from '../database/createDatabase.js';
import { loadRunnerConfig } from '../config/loadRunnerConfig.js';
import { discoverModules } from '../modules/discoverModules.js';
import type { DatabaseService, ModuleEntry } from '../types.js';

type DbTaskKind = 'migration' | 'seed' | 'reset';

type DbTaskOptions = {
  kind: DbTaskKind;
  moduleName?: string;
  force: boolean;
  refresh: boolean;
};

type SqlFile = {
  fileName: string;
  filePath: string;
  checksum: string;
  sql: string;
};

const HISTORY_TABLE_NAME = 'module_runner_db_history';

function makeHistoryTableSql(): string {
  return [
    'CREATE TABLE IF NOT EXISTS ' + HISTORY_TABLE_NAME + ' (',
    'id BIGSERIAL PRIMARY KEY,',
    'module_name TEXT NOT NULL,',
    'task_kind TEXT NOT NULL,',
    'file_name TEXT NOT NULL,',
    'checksum TEXT NOT NULL,',
    'applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
    'execution_ms INTEGER NOT NULL DEFAULT 0,',
    'forced BOOLEAN NOT NULL DEFAULT FALSE,',
    'UNIQUE (module_name, task_kind, file_name)',
    ');',
  ].join('\n');
}

function parseArgs(argv: string[]): DbTaskOptions {
  const command = argv[2];
  const options: DbTaskOptions = {
    kind: command === 'seed' ? 'seed' : command === 'reset' ? 'reset' : 'migration',
    moduleName: process.env.MODULE,
    force: process.env.DB_FORCE === '1',
    refresh: process.env.DB_REFRESH === '1',
  };

  for (let index = 3; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--force') {
      options.force = true;
      continue;
    }

    if (value === '--refresh') {
      options.refresh = true;
      continue;
    }

    if (value === '--module' || value === '-m') {
      options.moduleName = argv[index + 1];
      index += 1;
      continue;
    }

    if (value.startsWith('--module=')) {
      options.moduleName = value.slice('--module='.length);
    }
  }

  if (options.kind !== 'migration' && options.refresh) {
    throw new Error('--refresh is only supported with db:migrate. Use db:reset for reset + migrate + seed.');
  }

  return options;
}

function taskFolderName(kind: DbTaskKind): string {
  if (kind === 'migration') {
    return 'migrations';
  }

  if (kind === 'seed') {
    return 'seeders';
  }

  return 'reset';
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function checksumText(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

async function readSqlFiles(moduleEntry: ModuleEntry, kind: DbTaskKind): Promise<SqlFile[]> {
  const folder = path.join(moduleEntry.path, 'db', taskFolderName(kind));

  if (!await pathExists(folder)) {
    return [];
  }

  const names = (await fs.readdir(folder))
    .filter((name) => name.toLowerCase().endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  const files: SqlFile[] = [];

  for (const fileName of names) {
    const filePath = path.join(folder, fileName);
    const sql = await fs.readFile(filePath, 'utf8');
    const trimmedSql = sql.trim();

    if (!trimmedSql) {
      continue;
    }

    files.push({
      fileName,
      filePath,
      sql: trimmedSql,
      checksum: checksumText(trimmedSql),
    });
  }

  return files;
}

async function ensureHistoryTable(database: DatabaseService): Promise<void> {
  await database.query(makeHistoryTableSql());
}

function makeHistorySelectSql(): string {
  return [
    'SELECT 1',
    'FROM ' + HISTORY_TABLE_NAME,
    'WHERE module_name = $1',
    'AND task_kind = $2',
    'AND file_name = $3',
    'LIMIT 1',
  ].join('\n');
}

async function hasAppliedFile(
  database: DatabaseService,
  moduleName: string,
  kind: DbTaskKind,
  fileName: string,
): Promise<boolean> {
  const result = await database.query(makeHistorySelectSql(), [moduleName, kind, fileName]);
  return result.rows.length > 0;
}

function makeHistoryClearSql(): string {
  return [
    'DELETE FROM ' + HISTORY_TABLE_NAME,
    'WHERE module_name = $1',
  ].join('\n');
}

async function clearModuleHistory(database: DatabaseService, moduleName: string): Promise<void> {
  await database.query(makeHistoryClearSql(), [moduleName]);
}

function makeHistoryUpsertSql(): string {
  return [
    'INSERT INTO ' + HISTORY_TABLE_NAME + ' (',
    'module_name, task_kind, file_name, checksum, execution_ms, forced',
    ') VALUES ($1, $2, $3, $4, $5, $6)',
    'ON CONFLICT (module_name, task_kind, file_name)',
    'DO UPDATE SET',
    'checksum = EXCLUDED.checksum,',
    'applied_at = NOW(),',
    'execution_ms = EXCLUDED.execution_ms,',
    'forced = EXCLUDED.forced',
  ].join('\n');
}

async function recordAppliedFile(
  database: DatabaseService,
  moduleName: string,
  kind: DbTaskKind,
  file: SqlFile,
  executionMs: number,
  forced: boolean,
): Promise<void> {
  await database.query(
    makeHistoryUpsertSql(),
    [moduleName, kind, file.fileName, file.checksum, executionMs, forced],
  );
}

async function applySqlFile(
  database: DatabaseService,
  moduleEntry: ModuleEntry,
  kind: DbTaskKind,
  file: SqlFile,
  force: boolean,
): Promise<'applied' | 'skipped'> {
  if (!force && kind !== 'reset' && await hasAppliedFile(database, moduleEntry.name, kind, file.fileName)) {
    return 'skipped';
  }

  const startedAt = Date.now();
  await database.query(file.sql);
  await recordAppliedFile(database, moduleEntry.name, kind, file, Date.now() - startedAt, force);
  return 'applied';
}

async function runTaskFiles(
  database: DatabaseService,
  moduleEntry: ModuleEntry,
  kind: DbTaskKind,
  force: boolean,
  allowMissing: boolean,
): Promise<void> {
  const files = await readSqlFiles(moduleEntry, kind);

  if (files.length === 0) {
    if (!allowMissing) {
      console.log(`[${moduleEntry.name}] no ${taskFolderName(kind)} files found`);
    }
    return;
  }

  for (const file of files) {
    const result = await applySqlFile(database, moduleEntry, kind, file, force);
    const label = result === 'applied' ? (force ? 'forced' : 'applied') : 'skipped';
    console.log(`[${moduleEntry.name}] ${label} ${taskFolderName(kind)}/${file.fileName}`);
  }
}

async function refreshModule(database: DatabaseService, moduleEntry: ModuleEntry): Promise<void> {
  const resetFiles = await readSqlFiles(moduleEntry, 'reset');

  if (resetFiles.length > 0) {
    for (const file of resetFiles) {
      await applySqlFile(database, moduleEntry, 'reset', file, true);
      console.log(`[${moduleEntry.name}] reset reset/${file.fileName}`);
    }
  } else {
    console.log(`[${moduleEntry.name}] no reset files found; migrations must handle recreation safely`);
  }

  await clearModuleHistory(database, moduleEntry.name);
  console.log(`[${moduleEntry.name}] cleared database lifecycle history`);
  await runTaskFiles(database, moduleEntry, 'migration', true, false);
}

async function resetModule(database: DatabaseService, moduleEntry: ModuleEntry): Promise<void> {
  await refreshModule(database, moduleEntry);
  await runTaskFiles(database, moduleEntry, 'seed', true, false);
}

async function runForModule(moduleEntry: ModuleEntry, options: DbTaskOptions): Promise<void> {
  const config = loadRunnerConfig({ moduleEnvPath: path.join(moduleEntry.path, '.env') });
  const database = createDatabase(config.databaseUrl);

  try {
    await ensureHistoryTable(database);

    if (options.kind === 'reset') {
      await resetModule(database, moduleEntry);
      return;
    }

    if (options.kind === 'migration' && options.refresh) {
      await refreshModule(database, moduleEntry);
      return;
    }

    await runTaskFiles(database, moduleEntry, options.kind, options.force, false);
  } finally {
    await database.close();
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv);
  const config = loadRunnerConfig();
  const modules = await discoverModules(config.modulesRoot);
  const selectedModules = options.moduleName
    ? modules.filter((moduleEntry) => moduleEntry.name === options.moduleName)
    : modules;

  if (selectedModules.length === 0) {
    const available = modules.map((moduleEntry) => moduleEntry.name).join(', ');
    throw new Error(`No module matched "${options.moduleName ?? 'all'}". Available modules: ${available}`);
  }

  console.log(
    `Running ${taskFolderName(options.kind)} for ${selectedModules.length} module(s). ` +
    `Force: ${options.force ? 'yes' : 'no'}. Refresh: ${options.refresh ? 'yes' : 'no'}`,
  );

  for (const moduleEntry of selectedModules) {
    await runForModule(moduleEntry, options);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
