const { URL } = require('url');
const { findModuleRoute } = require('../modules/moduleRoutes');

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(';')) {
    const [key, ...valueParts] = part.trim().split('=');
    if (key) {
      cookies[key] = decodeURIComponent(valueParts.join('=') || '');
    }
  }
  return cookies;
}

function mergeQuery(urlObject, query = {}) {
  const merged = {};
  for (const [key, value] of urlObject.searchParams.entries()) {
    merged[key] = value;
  }
  if (query && typeof query === 'object') {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        merged[key] = String(value);
      }
    }
  }
  return merged;
}

async function dispatchModuleRequest({ moduleRoutes, method, requestPath, headers = {}, cookies = {}, query = {}, body = null, rawBody = '' }) {
  const matched = findModuleRoute(moduleRoutes, method, requestPath);
  if (!matched) {
    return {
      status: 404,
      headers: { 'content-type': 'application/json' },
      body: {
        error: 'Module route not found',
        method,
        path: requestPath,
        hint: 'Add routes to the selected module or choose a preset from moduleinfo.json.',
      },
    };
  }

  const result = await matched.route.handler({
    method,
    path: requestPath,
    headers,
    cookies,
    query,
    body,
    rawBody,
    params: matched.params,
  });

  if (result && typeof result === 'object' && ('status' in result || 'body' in result || 'headers' in result)) {
    return {
      status: result.status || 200,
      headers: result.headers || { 'content-type': 'application/json' },
      body: result.body === undefined ? null : result.body,
    };
  }

  return {
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: result === undefined ? null : result,
  };
}

async function sendAppRequest(moduleRoutes, payload) {
  const method = String(payload.method || 'GET').toUpperCase();
  const targetUrl = new URL(payload.url || '/', 'http://module.local');
  const query = mergeQuery(targetUrl, payload.query);
  const headers = payload.headers && typeof payload.headers === 'object' ? payload.headers : {};
  const cookies = payload.cookies && typeof payload.cookies === 'object' ? payload.cookies : {};

  return dispatchModuleRequest({
    moduleRoutes,
    method,
    requestPath: targetUrl.pathname,
    headers,
    cookies,
    query,
    body: payload.body === undefined ? null : payload.body,
    rawBody: typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body || null),
  });
}

module.exports = { parseCookies, dispatchModuleRequest, sendAppRequest };
