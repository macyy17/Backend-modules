import fs from 'node:fs/promises';
import path from 'node:path';
import type { ModuleEntry } from '../types.js';

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function discoverModules(modulesRoot: string): Promise<ModuleEntry[]> {
  let entries: import('node:fs').Dirent[] = [];
  try {
    entries = await fs.readdir(modulesRoot, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const modules: ModuleEntry[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const modulePath = path.join(modulesRoot, entry.name);
    const hasMarkdownInfo = await exists(path.join(modulePath, 'MODULEINFO.md'));
    const hasJsonInfo = await exists(path.join(modulePath, 'moduleinfo.json'));
    if (hasMarkdownInfo || hasJsonInfo) {
      modules.push({ name: entry.name, path: modulePath, hasMarkdownInfo, hasJsonInfo });
    }
  }

  return modules.sort((left, right) => left.name.localeCompare(right.name));
}
