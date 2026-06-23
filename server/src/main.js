const path = require('path');
const { discoverModules } = require('./modules/discoverModules');
const { loadModule } = require('./modules/loadModule');
const { loadModuleRoutes } = require('./modules/moduleRoutes');
const { selectModule } = require('./cli/selectModule');
const { createServer } = require('./http/createServer');

const DEFAULT_PORT = 3333;

async function main() {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const modulesRoot = path.join(projectRoot, 'modules');
  const modules = await discoverModules(modulesRoot);

  if (modules.length === 0) {
    console.error('No runnable modules found in ../modules. A module needs MODULEINFO.md or moduleinfo.json.');
    process.exitCode = 1;
    return;
  }

  const selectedModuleName = process.env.MODULE || await selectModule(modules);
  const selectedModule = modules.find((item) => item.name === selectedModuleName);

  if (!selectedModule) {
    console.error(`Module "${selectedModuleName}" was not found. Available modules: ${modules.map((item) => item.name).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const loadedModule = await loadModule(selectedModule);
  const moduleRoutes = await loadModuleRoutes(loadedModule);
  const port = Number.parseInt(process.env.PORT || String(DEFAULT_PORT), 10);

  const server = createServer({
    selectedModule: loadedModule,
    moduleRoutes,
  });

  server.listen(port, () => {
    const baseUrl = `http://localhost:${port}`;
    console.log('');
    console.log(`Running module: ${loadedModule.name}`);
    console.log(`Server: ${baseUrl}`);
    console.log(`Module info: ${baseUrl}/moduleinfo`);
    console.log(`App tester: ${baseUrl}/app`);
    if (moduleRoutes.length === 0) {
      console.log('No module routes were registered. /moduleinfo and /app are still available.');
    } else {
      console.log(`Registered module routes: ${moduleRoutes.length}`);
    }
  });
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
