import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { LoadedModule, ModuleRegisterContext, ModuleRoute, ModuleRouteHandler } from '../types.js';

const ROUTE_FILES = [
  'routes/index.ts',
  'routes.ts',
  'index.ts',
  'routes/index.js',
  'routes/index.cjs',
  'routes.js',
  'index.js',
];

type RouteLike = { method?: unknown; path?: unknown; description?: unknown; handler?: unknown };

function normalizeRoute(route: RouteLike): ModuleRoute | null {
  if (!route || typeof route.handler !== 'function') return null;
  const method = String(route.method || 'GET').toUpperCase();
  const routePath = String(route.path || '/');
  return {
    method,
    path: routePath.startsWith('/') ? routePath : `/${routePath}`,
    description: String(route.description || ''),
    handler: route.handler as ModuleRouteHandler,
  };
}

function splitPath(value: string): string[] {
  return value.split('/').filter(Boolean);
}

function matchPath(routePath: string, requestPath: string): Record<string, string> | null {
  const routeParts = splitPath(routePath);
  const requestParts = splitPath(requestPath);
  if (routeParts.length !== requestParts.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < routeParts.length; index += 1) {
    const routePart = routeParts[index];
    const requestPart = requestParts[index];
    if (routePart.startsWith(':')) {
      params[routePart.slice(1)] = decodeURIComponent(requestPart || '');
      continue;
    }
    if (routePart !== requestPart) return null;
  }
  return params;
}

async function readExports(routeModule: Record<string, unknown>, context: ModuleRegisterContext, routes: ModuleRoute[]): Promise<void> {
  if (typeof routeModule.registerRoutes === 'function') await routeModule.registerRoutes(context);

  const exportedRoutes = Array.isArray(routeModule.routes) ? routeModule.routes : [];
  for (const route of exportedRoutes) {
    const normalizedRoute = normalizeRoute(route as RouteLike);
    if (normalizedRoute) routes.push(normalizedRoute);
  }

  if (typeof routeModule.default === 'function') await routeModule.default(context);
  if (Array.isArray(routeModule.default)) {
    for (const route of routeModule.default) {
      const normalizedRoute = normalizeRoute(route as RouteLike);
      if (normalizedRoute) routes.push(normalizedRoute);
    }
  }
}

export async function loadModuleRoutes(selectedModule: LoadedModule, context: Omit<ModuleRegisterContext, 'addRoute' | 'selectedModule'>): Promise<ModuleRoute[]> {
  const routes: ModuleRoute[] = [];
  const registerContext: ModuleRegisterContext = {
    ...context,
    selectedModule,
    addRoute(method, routePath, handler, options = {}) {
      const normalizedRoute = normalizeRoute({ method, path: routePath, handler, description: options.description });
      if (normalizedRoute) routes.push(normalizedRoute);
    },
  };

  for (const relativeFile of ROUTE_FILES) {
    const routeFile = path.join(selectedModule.path, relativeFile);
    if (!fs.existsSync(routeFile)) continue;
    try {
      const routeModule = await import(pathToFileURL(routeFile).href) as Record<string, unknown>;
      await readExports(routeModule, registerContext, routes);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Could not load module route file ${relativeFile}: ${message}`);
    }
  }
  return routes;
}

export function findModuleRoute(moduleRoutes: ModuleRoute[], method: string, requestPath: string): { route: ModuleRoute; params: Record<string, string> } | null {
  const requestedMethod = String(method || 'GET').toUpperCase();
  for (const route of moduleRoutes) {
    if (route.method !== requestedMethod && route.method !== 'ALL') continue;
    const params = matchPath(route.path, requestPath);
    if (params) return { route, params };
  }
  return null;
}
