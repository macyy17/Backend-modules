import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RunnerConfig } from '../types.js';

const DEFAULT_PORT = 3333;
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/module_runner';

function readEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values: Record<string, string> = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex < 1) {
      continue;
    }
    const key = trimmed.slice(0, equalsIndex).trim();
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    values[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
  return values;
}

function firstValue(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => value !== undefined && value.trim() !== '');
}

function buildDatabaseUrl(env: Record<string, string | undefined>, fileEnv: Record<string, string>): string {
  const direct = firstValue(
    env.DATABASE_URL,
    env.POSTGRES_URL,
    env.MODULE_RUNNER_DATABASE_URL,
    fileEnv.DATABASE_URL,
    fileEnv.POSTGRES_URL,
    fileEnv.MODULE_RUNNER_DATABASE_URL,
  );
  if (direct) {
    return direct;
  }

  const user = firstValue(env.PGUSER, fileEnv.PGUSER) || 'postgres';
  const password = firstValue(env.PGPASSWORD, fileEnv.PGPASSWORD) || 'postgres';
  const host = firstValue(env.PGHOST, fileEnv.PGHOST) || 'localhost';
  const port = firstValue(env.PGPORT, fileEnv.PGPORT) || '5432';
  const database = firstValue(env.PGDATABASE, fileEnv.PGDATABASE) || 'module_runner';
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function maskDatabaseUrl(databaseUrl: string): string {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch (_error) {
    return databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
  }
}

export function loadRunnerConfig(): RunnerConfig {
  const sourceDir = path.dirname(fileURLToPath(import.meta.url));
  const serverRoot = path.resolve(sourceDir, '..', '..');
  const projectRoot = path.resolve(serverRoot, '..');
  const modulesRoot = path.join(projectRoot, 'modules');
  const fileEnv = {
    ...readEnvFile(path.join(projectRoot, '.env')),
    ...readEnvFile(path.join(serverRoot, '.env')),
  };
  const env = process.env;
  const portText = firstValue(env.PORT, fileEnv.PORT) || String(DEFAULT_PORT);
  const port = Number.parseInt(portText, 10);
  const databaseUrl = buildDatabaseUrl(env, fileEnv) || DEFAULT_DATABASE_URL;

  return {
    projectRoot,
    modulesRoot,
    selectedModuleName: firstValue(env.MODULE, fileEnv.MODULE),
    port: Number.isFinite(port) ? port : DEFAULT_PORT,
    databaseUrl,
    databaseUrlMasked: maskDatabaseUrl(databaseUrl),
  };
}
