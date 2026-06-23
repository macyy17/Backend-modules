import fs from 'node:fs/promises';
import path from 'node:path';
import type { EndpointPreset, JsonObject, LoadedModule, ModuleEntry, ModuleInfoJson } from '../types.js';

async function readTextIfExists(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return '';
    throw error;
  }
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function objectOrEmpty(value: unknown): JsonObject {
  return isObject(value) ? value : {};
}

function normalizeEndpoint(endpoint: unknown, index: number): EndpointPreset {
  const source = isObject(endpoint) ? endpoint : {};
  const method = String(source.method || 'GET').toUpperCase();
  const rawPath = String(source.path || source.url || '/');
  const endpointPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return {
    id: String(source.id || `${method}-${endpointPath}-${index}`),
    method,
    path: endpointPath,
    title: String(source.title || `${method} ${endpointPath}`),
    description: String(source.description || source.desc || ''),
    headers: objectOrEmpty(source.headers),
    cookies: objectOrEmpty(source.cookies),
    query: objectOrEmpty(source.query),
    body: source.body === undefined ? null : source.body,
    response: source.response === undefined ? null : source.response,
  };
}

export function parseModuleInfoJson(content: string, moduleName: string): ModuleInfoJson {
  if (!content || !content.trim()) {
    return { name: moduleName, title: moduleName, description: '', endpoints: [], warnings: ['moduleinfo.json is empty.'] };
  }
  try {
    const parsed: unknown = JSON.parse(content);
    if (!isObject(parsed)) {
      return { name: moduleName, title: moduleName, description: '', endpoints: [], raw: parsed, warnings: ['moduleinfo.json must be a JSON object.'] };
    }
    const endpointsSource = Array.isArray(parsed.endpoints) ? parsed.endpoints : [];
    return {
      name: String(parsed.name || moduleName),
      title: String(parsed.title || parsed.name || moduleName),
      description: String(parsed.description || ''),
      endpoints: endpointsSource.map(normalizeEndpoint),
      raw: parsed,
      warnings: Array.isArray(parsed.endpoints) ? [] : ['moduleinfo.json has no endpoints array.'],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { name: moduleName, title: moduleName, description: '', endpoints: [], warnings: [`moduleinfo.json could not be parsed: ${message}`] };
  }
}

export async function loadModule(moduleEntry: ModuleEntry): Promise<LoadedModule> {
  const [moduleInfoMarkdown, moduleInfoJsonText] = await Promise.all([
    readTextIfExists(path.join(moduleEntry.path, 'MODULEINFO.md')),
    readTextIfExists(path.join(moduleEntry.path, 'moduleinfo.json')),
  ]);
  return {
    name: moduleEntry.name,
    path: moduleEntry.path,
    moduleInfoMarkdown,
    moduleInfoJson: parseModuleInfoJson(moduleInfoJsonText, moduleEntry.name),
  };
}
