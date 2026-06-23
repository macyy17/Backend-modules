import type { DatabaseService, LoadedModule } from '../types.js';
import { escapeHtml, renderMarkdown } from './markdown.js';

function renderWarnings(warnings: string[]): string {
  if (!warnings || warnings.length === 0) return '';
  const items = warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('');
  return `<aside class="warning"><strong>Metadata warnings</strong><ul>${items}</ul></aside>`;
}

export function renderModuleInfo(selectedModule: LoadedModule, database: DatabaseService): string {
  const title = selectedModule.moduleInfoJson.title || selectedModule.name;
  const description = selectedModule.moduleInfoJson.description || '';
  const endpointCount = selectedModule.moduleInfoJson.endpoints.length;
  const markdown = renderMarkdown(selectedModule.moduleInfoMarkdown);
  const warnings = renderWarnings(selectedModule.moduleInfoJson.warnings);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} module info</title>
  <style>
    body { margin: 0; background: #111827; color: #e5e7eb; font-family: system-ui, sans-serif; }
    main { max-width: 960px; margin: 0 auto; padding: 40px 20px; }
    a { color: #93c5fd; }
    .topbar { display: flex; gap: 12px; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .nav { display: flex; gap: 10px; flex-wrap: wrap; }
    .nav a { background: #1f2937; border: 1px solid #374151; border-radius: 999px; color: #e5e7eb; padding: 8px 12px; text-decoration: none; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 18px; padding: 24px; }
    .meta { color: #94a3b8; margin: 8px 0 24px; }
    .warning { border: 1px solid #f59e0b; background: rgba(245, 158, 11, .12); border-radius: 14px; padding: 16px; margin: 16px 0; }
    pre { overflow: auto; background: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; }
    code { background: #020617; border: 1px solid #1e293b; border-radius: 6px; padding: 2px 5px; }
    pre code { border: 0; padding: 0; }
    .empty-state { color: #cbd5e1; border: 1px dashed #475569; border-radius: 14px; padding: 16px; }
  </style>
</head>
<body>
  <main>
    <div class="topbar">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p class="meta">Module: ${escapeHtml(selectedModule.name)} | Endpoint presets: ${endpointCount}</p>
        <p class="meta">PostgreSQL: ${escapeHtml(database.connectionStringMasked)}</p>
        ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      </div>
      <nav class="nav">
        <a href="/app">Open /app</a>
        <a href="/app/presets">Presets JSON</a>
        <a href="/db/health">DB health</a>
      </nav>
    </div>
    ${warnings}
    <article class="card">${markdown}</article>
  </main>
</body>
</html>`;
}
