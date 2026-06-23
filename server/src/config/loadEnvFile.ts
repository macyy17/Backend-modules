import fs from 'node:fs';
import path from 'node:path';

function clean_env_value(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function loadEnvFile(file_path = path.resolve(process.cwd(), '.env')): Record<string, string> {
  if (!fs.existsSync(file_path)) {
    return {};
  }

  const parsed: Record<string, string> = {};
  const content = fs.readFileSync(file_path, 'utf8');

  for (const raw_line of content.split(/\r?\n/)) {
    const line = raw_line.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separator_index = line.indexOf('=');

    if (separator_index <= 0) {
      continue;
    }

    const key = line.slice(0, separator_index).trim();
    const value = clean_env_value(line.slice(separator_index + 1));

    parsed[key] = value;

    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }

  return parsed;
}
