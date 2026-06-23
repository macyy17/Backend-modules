import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RunnerConfig } from '../types.js';

const DEFAULT_PORT = 3333;
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/module_runner';
const PROCESS_ENV_AT_START = { ...process.env };

const RUNNER_OVERRIDE_KEYS = [
  'MODULE',
  'PORT',
  'DATABASE_URL',
  'POSTGRES_URL',
  'MODULE_RUNNER_DATABASE_URL',
  'PGUSER',
  'PGPASSWORD',
  'PGHOST',
  'PGPORT',
  'PGDATABASE',
];

export type LoadRunnerConfigOptions = {
  moduleEnvPath?: string;
};

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};

  const values: Record<string, string> = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex < 1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    values[key] = rawValue.replace(/^["']|["']$/g, '');
  }

  return values;
}

function firstValue(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value.trim() !== '');
}

function collectRunnerOverrides(): Record<string, string> {
  const overrides: Record<string, string> = {};

  for (const key of RUNNER_OVERRIDE_KEYS) {
    const value = PROCESS_ENV_AT_START[key];
    if (value !== undefined && value.trim() !== '') {
      overrides[key] = value;
    }
  }

  return overrides;
}

function applyProcessEnv(fileEnv: Record<string, string>, runnerOverrides: Record<string, string>): void {
  for (const [key, value] of Object.entries(fileEnv)) {
    process.env[key] = value;
  }

  for (const [key, value] of Object.entries(runnerOverrides)) {
    process.env[key] = value;
  }
}

function buildDatabaseUrl(env: Record<string, string | undefined>): string {
  const direct = firstValue(
    env.DATABASE_URL,
    env.POSTGRES_URL,
    env.MODULE_RUNNER_DATABASE_URL,
  );

  if (direct) return direct;

  const user = firstValue(env.PGUSER) || 'postgres';
  const password = firstValue(env.PGPASSWORD) || 'postgres';
  const host = firstValue(env.PGHOST) || 'localhost';
  const port = firstValue(env.PGPORT) || '5432';
  const database = firstValue(env.PGDATABASE) || 'module_runner';

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function maskDatabaseUrl(databaseUrl: string): string {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.password) parsed.password = '****';
    return parsed.toString();
  } catch (_error) {
    return databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  }
}

export function loadRunnerConfig(options: LoadRunnerConfigOptions = {}): RunnerConfig {
  const sourceDir = path.dirname(fileURLToPath(import.meta.url));
  const serverRoot = path.resolve(sourceDir, '..', '..');
  const projectRoot = path.resolve(serverRoot, '..');
  const modulesRoot = path.join(projectRoot, 'modules');

  const envFilePaths = [
    path.join(projectRoot, '.env'),
    path.join(serverRoot, '.env'),
    options.moduleEnvPath,
  ].filter((value): value is string => Boolean(value));

  const existingEnvFilePaths = envFilePaths.filter((filePath) => fs.existsSync(filePath));
  const fileEnv = existingEnvFilePaths.reduce<Record<string, string>>((values, filePath) => {
    return { ...values, ...readEnvFile(filePath) };
  }, {});
  const runnerOverrides = collectRunnerOverrides();
  const env = { ...fileEnv, ...runnerOverrides };

  applyProcessEnv(fileEnv, runnerOverrides);

  const portText = firstValue(env.PORT) || String(DEFAULT_PORT);
  const port = Number.parseInt(portText, 10);
  const databaseUrl = buildDatabaseUrl(env) || DEFAULT_DATABASE_URL;

  return {
    projectRoot,
    modulesRoot,
    selectedModuleName: firstValue(env.MODULE),
    port: Number.isFinite(port) ? port : DEFAULT_PORT,
    databaseUrl,
    databaseUrlMasked: maskDatabaseUrl(databaseUrl),
    envFilesLoaded: existingEnvFilePaths,
    moduleEnvPath: options.moduleEnvPath,
  };
}
