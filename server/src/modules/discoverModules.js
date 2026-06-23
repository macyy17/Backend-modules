const fs = require('fs/promises');
const path = require('path');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (_error) {
    return false;
  }
}

async function discoverModules(modulesRoot) {
  let entries = [];
  try {
    entries = await fs.readdir(modulesRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const modules = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const modulePath = path.join(modulesRoot, entry.name);
    const hasMarkdownInfo = await exists(path.join(modulePath, 'MODULEINFO.md'));
    const hasJsonInfo = await exists(path.join(modulePath, 'moduleinfo.json'));

    if (hasMarkdownInfo || hasJsonInfo) {
      modules.push({
        name: entry.name,
        path: modulePath,
        hasMarkdownInfo,
        hasJsonInfo,
      });
    }
  }

  modules.sort((left, right) => left.name.localeCompare(right.name));
  return modules;
}

module.exports = { discoverModules };
