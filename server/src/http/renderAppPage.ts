import type { DatabaseService, LoadedModule } from '../types.js';
import { escapeHtml } from './markdown.js';

export function renderAppPage(selectedModule: LoadedModule, database: DatabaseService): string {
  const title = selectedModule.moduleInfoJson.title || selectedModule.name;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} tester</title>
  <style>
    body { margin: 0; background: #0f172a; color: #e5e7eb; font-family: system-ui, sans-serif; }
    main { max-width: 1180px; margin: 0 auto; padding: 28px 18px 48px; }
    a { color: #93c5fd; }
    .top { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 20px; }
    .card { background: #111827; border: 1px solid #334155; border-radius: 18px; padding: 18px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .row { display: flex; gap: 10px; align-items: end; }
    label { display: block; color: #cbd5e1; font-size: 13px; margin: 0 0 6px; }
    input, select, textarea, button { font: inherit; }
    input, select, textarea { width: 100%; box-sizing: border-box; border: 1px solid #475569; border-radius: 12px; background: #020617; color: #e5e7eb; padding: 10px 12px; }
    textarea { min-height: 140px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    button { border: 0; border-radius: 12px; padding: 10px 14px; background: #2563eb; color: white; cursor: pointer; }
    button.secondary { background: #334155; }
    .response { white-space: pre-wrap; background: #020617; border: 1px solid #1e293b; border-radius: 14px; padding: 14px; min-height: 180px; overflow: auto; }
    .modal { position: fixed; inset: 0; background: rgba(2, 6, 23, .82); display: none; align-items: flex-start; justify-content: center; padding: 40px 18px; }
    .modal.open { display: flex; }
    .modal-panel { width: min(900px, 100%); max-height: 85vh; overflow: auto; background: #111827; border: 1px solid #475569; border-radius: 20px; padding: 18px; }
    .preset { display: grid; grid-template-columns: 92px 1fr; gap: 14px; border: 1px solid #334155; border-radius: 16px; padding: 14px; margin: 10px 0; cursor: pointer; background: #0f172a; }
    .preset:hover { border-color: #93c5fd; }
    .method { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; font-weight: 800; background: #334155; padding: 8px; height: 24px; }
    .GET { background: #166534; } .POST { background: #1d4ed8; } .PUT, .PATCH { background: #854d0e; } .DELETE { background: #991b1b; }
    .muted { color: #94a3b8; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } .top, .row { align-items: flex-start; flex-direction: column; } }
  </style>
</head>
<body>
  <main>
    <div class="top">
      <div>
        <h1>${escapeHtml(title)} tester</h1>
        <p class="muted">Selected module: ${escapeHtml(selectedModule.name)}</p>
        <p class="muted">PostgreSQL: ${escapeHtml(database.connectionStringMasked)}</p>
      </div>
      <div class="row"><a href="/moduleinfo">Module info</a><a href="/app/presets">Presets JSON</a><a href="/db/health">DB health</a></div>
    </div>

    <section class="card">
      <div class="row"><button class="secondary" id="open-presets">Search presets</button><button id="send-request">Send request</button></div>
      <p id="selected-description" class="muted">Choose a preset or enter a raw request manually.</p>
    </section>

    <section class="card">
      <div class="row">
        <div style="width:150px"><label for="method">Method</label><select id="method"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></div>
        <div style="flex:1"><label for="url">URL</label><input id="url" value="/" placeholder="/translate"></div>
      </div>
    </section>

    <section class="grid">
      <div class="card"><label for="headers">Headers JSON</label><textarea id="headers">{}</textarea></div>
      <div class="card"><label for="cookies">Cookies JSON</label><textarea id="cookies">{}</textarea></div>
      <div class="card"><label for="query">Query params JSON</label><textarea id="query">{}</textarea></div>
      <div class="card"><label for="body">Body JSON</label><textarea id="body">null</textarea></div>
    </section>

    <section class="card"><h2>Response</h2><div id="response" class="response">No request sent yet.</div></section>
  </main>

  <div class="modal" id="preset-modal"><div class="modal-panel"><div class="row"><input id="preset-search" placeholder="Search by method, URL, or description"><button class="secondary" id="close-presets">Close</button></div><div id="preset-list"></div></div></div>

  <script>
    const state = { presets: [] };
    const byId = (id) => document.getElementById(id);
    const pretty = (value) => JSON.stringify(value, null, 2);
    function parseJsonField(id) { const value = byId(id).value.trim(); return value ? JSON.parse(value) : {}; }
    function matches(preset, search) { return [preset.method, preset.path, preset.title, preset.description].join(' ').toLowerCase().includes(search.toLowerCase()); }
    function renderPresets() {
      const search = byId('preset-search').value.trim();
      const list = byId('preset-list');
      const found = state.presets.filter((preset) => matches(preset, search));
      list.innerHTML = found.length ? '' : '<p class="muted">No matching presets.</p>';
      for (const preset of found) {
        const item = document.createElement('div');
        item.className = 'preset';
        item.innerHTML = '<div class="method ' + preset.method + '">' + preset.method + '</div><div><strong>' + preset.path + '</strong><p>' + (preset.description || 'No description.') + '</p></div>';
        item.addEventListener('click', () => applyPreset(preset));
        list.appendChild(item);
      }
    }
    function applyPreset(preset) {
      byId('method').value = preset.method || 'GET';
      byId('url').value = preset.path || '/';
      byId('headers').value = pretty(preset.headers || {});
      byId('cookies').value = pretty(preset.cookies || {});
      byId('query').value = pretty(preset.query || {});
      byId('body').value = pretty(preset.body === undefined ? null : preset.body);
      byId('selected-description').textContent = preset.description || 'No endpoint description in moduleinfo.json.';
      byId('preset-modal').classList.remove('open');
    }
    async function loadPresets() { const response = await fetch('/app/presets'); const data = await response.json(); state.presets = data.endpoints || []; renderPresets(); }
    async function sendRequest() {
      const output = byId('response'); output.textContent = 'Sending...';
      try {
        const payload = { method: byId('method').value, url: byId('url').value, headers: parseJsonField('headers'), cookies: parseJsonField('cookies'), query: parseJsonField('query'), body: parseJsonField('body') };
        const response = await fetch('/app/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        output.textContent = pretty(await response.json());
      } catch (error) { output.textContent = error.message; }
    }
    byId('open-presets').addEventListener('click', () => byId('preset-modal').classList.add('open'));
    byId('close-presets').addEventListener('click', () => byId('preset-modal').classList.remove('open'));
    byId('preset-search').addEventListener('input', renderPresets);
    byId('send-request').addEventListener('click', sendRequest);
    loadPresets().catch((error) => { byId('preset-list').textContent = error.message; });
  </script>
</body>
</html>`;
}
