const fs = require('fs/promises');
const path = require('path');

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

function normalizeEndpoint(endpoint, index) {
  const method = String(endpoint.method || 'GET').toUpperCase();
  const rawPath = String(endpoint.path || endpoint.url || '/');
  const endpointPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  return {
    id: endpoint.id || `${method}-${endpointPath}-${index}`,
    method,
    path: endpointPath,
    title: endpoint.title || `${method} ${endpointPath}`,
    description: endpoint.description || endpoint.desc || '',
    headers: endpoint.headers && typeof endpoint.headers === 'object' ? endpoint.headers : {},
    cookies: endpoint.cookies && typeof endpoint.cookies === 'object' ? endpoint.cookies : {},
    query: endpoint.query && typeof endpoint.query === 'object' ? endpoint.query : {},
    body: endpoint.body === undefined ? null : endpoint.body,
    response: endpoint.response === undefined ? null : endpoint.response,
  };
}

function parseModuleInfoJson(content, moduleName) {
  if (!content || !content.trim()) {
    return {
      name: moduleName,
      title: moduleName,
      description: '',
      endpoints: [],
      warnings: ['moduleinfo.json is empty.'],
    };
  }

  try {
    const parsed = JSON.parse(content);
    const endpoints = Array.isArray(parsed.endpoints) ? parsed.endpoints.map(normalizeEndpoint) : [];
    return {
      name: parsed.name || moduleName,
      title: parsed.title || parsed.name || moduleName,
      description: parsed.description || '',
      endpoints,
      raw: parsed,
      warnings: Array.isArray(parsed.endpoints) ? [] : ['moduleinfo.json has no endpoints array.'],
    };
  } catch (error) {
    return {
      name: moduleName,
      title: moduleName,
      description: '',
      endpoints: [],
      warnings: [`moduleinfo.json could not be parsed: ${error.message}`],
    };
  }
}

async function loadModule(moduleEntry) {
  const markdownPath = path.join(moduleEntry.path, 'MODULEINFO.md');
  const jsonPath = path.join(moduleEntry.path, 'moduleinfo.json');
  const [moduleInfoMarkdown, moduleInfoJsonText] = await Promise.all([
    readTextIfExists(markdownPath),
    readTextIfExists(jsonPath),
  ]);

  return {
    name: moduleEntry.name,
    path: moduleEntry.path,
    moduleInfoMarkdown,
    moduleInfoJson: parseModuleInfoJson(moduleInfoJsonText, moduleEntry.name),
  };
}

module.exports = { loadModule, parseModuleInfoJson };
