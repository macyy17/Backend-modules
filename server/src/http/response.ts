import type { ServerResponse } from 'node:http';

export function sendText(response: ServerResponse, statusCode: number, text: string, contentType = 'text/plain; charset=utf-8', extraHeaders: Record<string, string> = {}): void {
  response.writeHead(statusCode, {
    ...extraHeaders,
    'content-type': contentType,
    'content-length': Buffer.byteLength(text),
  });
  response.end(text);
}

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown, extraHeaders: Record<string, string> = {}): void {
  sendText(response, statusCode, JSON.stringify(payload, null, 2), 'application/json; charset=utf-8', extraHeaders);
}

export function sendHtml(response: ServerResponse, statusCode: number, html: string): void {
  sendText(response, statusCode, html, 'text/html; charset=utf-8');
}
