const path = require('path');

const ROUTE_FILES = [
  'routes/index.js',
  'routes/index.cjs',
  'routes.js',
  'index.js',
];

function compilePath(routePath) {
  const keys = [];
  const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
  const pattern = normalizedPath
    .split('/')
    .map((part) => {
      if (!part) {
        return '';
      }
      if (part.startsWith(':')) {
        keys.push(part.slice(1));
        return '([^/]+)';
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return {
    keys,
    regex: new RegExp(`^${pattern}/?$`),
  };
}

function normalizeRoute(route) {
  if (!route || typeof route.handler !== 'function') {
    return null;
  }

  const method = String(route.method || 'GET').toUpperCase();
  const routePath = String(route.path || '/');
  const compiled = compilePath(routePath);

  return {
    method,
    path: routePath.startsWith('/') ? routePath : `/${routePath}`,
    description: route.description || '',
    handler: route.handler,
    keys: compiled.keys,
    regex: compiled.regex,
  };
}

async function loadModuleRoutes(selectedModule) {
  const routes = [];
  const context = {
    addRoute(method, routePath, handler, options = {}) {
      const normalizedRoute = normalizeRoute({
        method,
        path: routePath,
        handler,
        description: options.description,
      });
      if (normalizedRoute) {
        routes.push(normalizedRoute);
      }
    },
  };

  for (const relativeFile of ROUTE_FILES) {
    const routeFile = path.join(selectedModule.path, relativeFile);
    let routeModule;
    try {
      routeModule = require(routeFile);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(routeFile)) {
        continue;
      }
      console.warn(`Could not load module route file ${relativeFile}: ${error.message}`);
      continue;
    }

    if (typeof routeModule.registerRoutes === 'function') {
      await routeModule.registerRoutes(context);
    }

    const exportedRoutes = Array.isArray(routeModule.routes) ? routeModule.routes : [];
    for (const route of exportedRoutes) {
      const normalizedRoute = normalizeRoute(route);
      if (normalizedRoute) {
        routes.push(normalizedRoute);
      }
    }

    if (typeof routeModule.default === 'function') {
      await routeModule.default(context);
    }
  }

  return routes;
}

function findModuleRoute(moduleRoutes, method, requestPath) {
  const requestedMethod = String(method || 'GET').toUpperCase();
  for (const route of moduleRoutes) {
    if (route.method !== requestedMethod && route.method !== 'ALL') {
      continue;
    }

    const match = route.regex.exec(requestPath);
    if (!match) {
      continue;
    }

    const params = {};
    route.keys.forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1] || '');
    });
    return { route, params };
  }
  return null;
}

module.exports = { loadModuleRoutes, findModuleRoute };
