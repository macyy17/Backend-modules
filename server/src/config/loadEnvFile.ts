import fs from 'node:fs';
import path from 'node:path';

export type LoadEnvFileOptions = {
  override?: boolean;
  preserveKeys?: string[];
};

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

export function loadEnvFile(
  file_path = path.resolve(process.cwd(), '.env'),
  options: LoadEnvFileOptions = {},
): Record<string, string> {
  if (!fs.existsSync(file_path)) {
    return {};
  }

  const preserve_keys = new Set(options.preserveKeys ?? []);
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

    const has_existing_value = process.env[key] !== undefined && process.env[key] !== '';
    const should_preserve_existing = preserve_keys.has(key) && has_existing_value;
    const should_set_value = options.override === true || !has_existing_value;

    if (should_set_value && !should_preserve_existing) {
      process.env[key] = value;
    }
  }

  return parsed;
}
