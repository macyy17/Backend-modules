import { URL } from 'node:url';
import type { DatabaseService, JsonObject, ModuleRoute } from '../types.js';
import { findModuleRoute } from '../modules/moduleRoutes.js';

export function parseCookies(cookieHeader: string): JsonObject {
  const cookies: JsonObject = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(';')) {
    const [key, ...valueParts] = part.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(valueParts.join('=') || '');
  }
  return cookies;
}

function mergeQuery(urlObject: URL, query: unknown): JsonObject {
  const merged: JsonObject = {};
  for (const [key, value] of urlObject.searchParams.entries()) merged[key] = value;
  if (query && typeof query === 'object' && !Array.isArray(query)) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') merged[key] = String(value);
    }
  }
  return merged;
}

function objectOrEmpty(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
}

export async function dispatchModuleRequest(input: {
  moduleRoutes: ModuleRoute[];
  database: DatabaseService;
  method: string;
  requestPath: string;
  headers?: Record<string, unknown>;
  cookies?: JsonObject;
  query?: JsonObject;
  body?: unknown;
  rawBody?: string;
}) {
  const matched = findModuleRoute(input.moduleRoutes, input.method, input.requestPath);
  if (!matched) {
    return {
      status: 404,
      headers: { 'content-type': 'application/json' },
      body: {
        error: 'Module route not found',
        method: input.method,
        path: input.requestPath,
        hint: 'Add routes to the selected module or choose a preset from moduleinfo.json.',
      },
    };
  }

  const result = await matched.route.handler({
    method: input.method,
    path: input.requestPath,
    headers: input.headers || {},
    cookies: input.cookies || {},
    query: input.query || {},
    body: input.body === undefined ? null : input.body,
    rawBody: input.rawBody || '',
    params: matched.params,
    database: input.database,
    databaseUrl: input.database.connectionString,
  });

  if (result && typeof result === 'object' && ('status' in result || 'body' in result || 'headers' in result)) {
    const shaped = result as { status?: number; headers?: Record<string, string>; body?: unknown };
    return { status: shaped.status || 200, headers: shaped.headers || { 'content-type': 'application/json' }, body: shaped.body === undefined ? null : shaped.body };
  }

  return { status: 200, headers: { 'content-type': 'application/json' }, body: result === undefined ? null : result };
}

export async function sendAppRequest(moduleRoutes: ModuleRoute[], database: DatabaseService, payload: unknown) {
  const source = objectOrEmpty(payload);
  const method = String(source.method || 'GET').toUpperCase();
  const targetUrl = new URL(String(source.url || '/'), 'http://module.local');
  return dispatchModuleRequest({
    moduleRoutes,
    database,
    method,
    requestPath: targetUrl.pathname,
    headers: objectOrEmpty(source.headers),
    cookies: objectOrEmpty(source.cookies),
    query: mergeQuery(targetUrl, source.query),
    body: source.body === undefined ? null : source.body,
    rawBody: typeof source.body === 'string' ? source.body : JSON.stringify(source.body ?? null),
  });
}
