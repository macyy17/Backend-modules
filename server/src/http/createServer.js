const http = require('http');
const { URL } = require('url');
const { sendJson, sendHtml, sendText } = require('./response');
const { renderModuleInfo } = require('./renderModuleInfo');
const { renderAppPage } = require('./renderAppPage');
const { parseCookies, dispatchModuleRequest, sendAppRequest } = require('./requestSender');

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function parseJsonBody(rawBody) {
  if (!rawBody || !rawBody.trim()) {
    return null;
  }
  return JSON.parse(rawBody);
}

function sendModuleResult(response, result) {
  const body = result.body === undefined ? null : result.body;
  const headers = result.headers || {};
  const contentType = String(headers['content-type'] || headers['Content-Type'] || 'application/json');

  if (contentType.includes('application/json') || typeof body === 'object') {
    sendJson(response, result.status || 200, body);
    return;
  }

  sendText(response, result.status || 200, String(body), contentType);
}

function buildQuery(urlObject) {
  const query = {};
  for (const [key, value] of urlObject.searchParams.entries()) {
    query[key] = value;
  }
  return query;
}

function createServer({ selectedModule, moduleRoutes }) {
  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, 'http://module-runner.local');

    try {
      if (request.method === 'GET' && requestUrl.pathname === '/') {
        response.writeHead(302, { location: '/moduleinfo' });
        response.end();
        return;
      }

      if (request.method === 'GET' && requestUrl.pathname === '/moduleinfo') {
        sendHtml(response, 200, renderModuleInfo(selectedModule));
        return;
      }

      if (request.method === 'GET' && requestUrl.pathname === '/app') {
        sendHtml(response, 200, renderAppPage(selectedModule));
        return;
      }

      if (request.method === 'GET' && requestUrl.pathname === '/app/presets') {
        sendJson(response, 200, {
          module: selectedModule.name,
          title: selectedModule.moduleInfoJson.title,
          description: selectedModule.moduleInfoJson.description,
          warnings: selectedModule.moduleInfoJson.warnings || [],
          endpoints: selectedModule.moduleInfoJson.endpoints || [],
        });
        return;
      }

      if (request.method === 'POST' && requestUrl.pathname === '/app/request') {
        const rawBody = await readBody(request);
        const payload = parseJsonBody(rawBody) || {};
        const result = await sendAppRequest(moduleRoutes, payload);
        sendJson(response, 200, {
          request: {
            method: payload.method || 'GET',
            url: payload.url || '/',
          },
          response: result,
        });
        return;
      }

      const rawBody = await readBody(request);
      let parsedBody = null;
      try {
        parsedBody = parseJsonBody(rawBody);
      } catch (_error) {
        parsedBody = rawBody;
      }

      const result = await dispatchModuleRequest({
        moduleRoutes,
        method: request.method,
        requestPath: requestUrl.pathname,
        headers: request.headers,
        cookies: parseCookies(request.headers.cookie || ''),
        query: buildQuery(requestUrl),
        body: parsedBody,
        rawBody,
      });
      sendModuleResult(response, result);
    } catch (error) {
      sendJson(response, 500, {
        error: 'Module runner error',
        message: error.message,
      });
    }
  });
}

module.exports = { createServer, readBody, parseJsonBody };
