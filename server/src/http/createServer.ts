import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import { URL } from 'node:url';
import type { DatabaseService, LoadedModule, JsonObject, ModuleRoute, RunnerConfig } from '../types.js';
import { sendJson, sendHtml, sendText } from './response.js';
import { renderModuleInfo } from './renderModuleInfo.js';
import { renderAppPage } from './renderAppPage.js';
import { parseCookies, dispatchModuleRequest, sendAppRequest } from './requestSender.js';

const BODY_LIMIT_BYTES = 2 * 1024 * 1024;

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    request.on('data', (chunk: Buffer) => {
      size += chunk.length;

      if (size > BODY_LIMIT_BYTES) {
        reject(new Error('Request body is too large. Limit is 2MB.'));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function parseJsonBody(rawBody: string): unknown {
  if (!rawBody || !rawBody.trim()) return null;
  return JSON.parse(rawBody);
}

function buildQuery(urlObject: URL): JsonObject {
  const query: JsonObject = {};
  for (const [key, value] of urlObject.searchParams.entries()) query[key] = value;
  return query;
}

function sendModuleResult(response: ServerResponse, result: { status?: number; headers?: Record<string, string>; body?: unknown }): void {
  const body = result.body === undefined ? null : result.body;
  const headers = result.headers || {};
  const contentType = String(headers['content-type'] || headers['Content-Type'] || 'application/json');

  if (contentType.includes('application/json') || typeof body === 'object') {
    sendJson(response, result.status || 200, body, headers);
    return;
  }

  sendText(response, result.status || 200, String(body), contentType, headers);
}

function relativeConfigPath(config: RunnerConfig, filePath: string): string {
  return path.relative(config.projectRoot, filePath) || filePath;
}

export function createServer(input: { selectedModule: LoadedModule; moduleRoutes: ModuleRoute[]; database: DatabaseService; config: RunnerConfig }) {
  const { selectedModule, moduleRoutes, database, config } = input;

  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://module-runner.local');
    const method = request.method || 'GET';

    try {
      if ((method === 'GET' || method === 'HEAD') && requestUrl.pathname === '/') {
        response.writeHead(302, { location: '/moduleinfo' });
        response.end();
        return;
      }

      if ((method === 'GET' || method === 'HEAD') && requestUrl.pathname === '/moduleinfo') {
        sendHtml(response, 200, renderModuleInfo(selectedModule, database));
        return;
      }

      if ((method === 'GET' || method === 'HEAD') && requestUrl.pathname === '/app') {
        sendHtml(response, 200, renderAppPage(selectedModule, database));
        return;
      }

      if ((method === 'GET' || method === 'HEAD') && requestUrl.pathname === '/app/presets') {
        sendJson(response, 200, {
          module: selectedModule.name,
          title: selectedModule.moduleInfoJson.title,
          description: selectedModule.moduleInfoJson.description,
          warnings: selectedModule.moduleInfoJson.warnings || [],
          database: { connectionString: database.connectionStringMasked },
          endpoints: selectedModule.moduleInfoJson.endpoints || [],
        });
        return;
      }

      if ((method === 'GET' || method === 'HEAD') && requestUrl.pathname === '/db/health') {
        const health = await database.health();
        sendJson(response, health.ok ? 200 : 503, { database: database.connectionStringMasked, ...health });
        return;
      }

      if ((method === 'GET' || method === 'HEAD') && requestUrl.pathname === '/runner/config') {
        sendJson(response, 200, {
          module: selectedModule.name,
          port: config.port,
          databaseUrl: config.databaseUrlMasked,
          envFilesLoaded: config.envFilesLoaded.map((filePath) => relativeConfigPath(config, filePath)),
          moduleEnvLoaded: config.envFilesLoaded.includes(config.moduleEnvPath || ''),
          moduleRoutes: moduleRoutes.map((route) => ({ method: route.method, path: route.path, description: route.description })),
        });
        return;
      }

      if (method === 'POST' && requestUrl.pathname === '/app/request') {
        const rawBody = await readBody(request);
        const payload = parseJsonBody(rawBody) || {};
        const result = await sendAppRequest(moduleRoutes, database, payload);
        sendJson(response, 200, {
          request: { method: (payload as { method?: string }).method || 'GET', url: (payload as { url?: string }).url || '/' },
          response: result,
        });
        return;
      }

      const rawBody = await readBody(request);
      let parsedBody: unknown = null;

      try {
        parsedBody = parseJsonBody(rawBody);
      } catch {
        parsedBody = rawBody;
      }

      const result = await dispatchModuleRequest({
        moduleRoutes,
        database,
        method,
        requestPath: requestUrl.pathname,
        headers: request.headers as Record<string, unknown>,
        cookies: parseCookies(String(request.headers.cookie || '')),
        query: buildQuery(requestUrl),
        body: parsedBody,
        rawBody,
      });

      sendModuleResult(response, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(response, 500, { error: { code: 'MODULE_RUNNER_ERROR', message } });
    }
  });
}
