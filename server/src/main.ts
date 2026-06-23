import { loadEnvFile } from './config/loadEnvFile.js';
import { createServer } from './http/createServer.js';
import { selectModule } from './cli/selectModule.js';
import { discoverModules } from './modules/discoverModules.js';
import { loadModule } from './modules/loadModule.js';
import { loadModuleRoutes } from './modules/moduleRoutes.js';
import { loadRunnerConfig } from './config/loadRunnerConfig.js';
import { createDatabase } from './database/createDatabase.js';
loadEnvFile();

async function main(): Promise<void> {
  const config = loadRunnerConfig();
  const database = createDatabase(config.databaseUrl);
  const modules = await discoverModules(config.modulesRoot);

  if (modules.length === 0) {
    console.error('No runnable modules found in ../modules. A module needs MODULEINFO.md or moduleinfo.json.');
    process.exitCode = 1;
    await database.close();
    return;
  }

  const selectedModuleName = config.selectedModuleName || await selectModule(modules);
  const selectedModule = modules.find((item) => item.name === selectedModuleName);

  if (!selectedModule) {
    console.error(`Module "${selectedModuleName}" was not found. Available modules: ${modules.map((item) => item.name).join(', ')}`);
    process.exitCode = 1;
    await database.close();
    return;
  }

  const loadedModule = await loadModule(selectedModule);
  const moduleRoutes = await loadModuleRoutes(loadedModule, {
    database,
    databaseUrl: database.connectionString,
    config,
  });
  const server = createServer({ selectedModule: loadedModule, moduleRoutes, database, config });

  server.listen(config.port, () => {
    const baseUrl = `http://localhost:${config.port}`;
    console.log('');
    console.log(`Running module: ${loadedModule.name}`);
    console.log(`Server: ${baseUrl}`);
    console.log(`Module info: ${baseUrl}/moduleinfo`);
    console.log(`App tester: ${baseUrl}/app`);
    console.log(`DB health: ${baseUrl}/db/health`);
    console.log(`PostgreSQL: ${database.connectionStringMasked}`);
    console.log(moduleRoutes.length === 0 ? 'No module routes were registered. /moduleinfo and /app are still available.' : `Registered module routes: ${moduleRoutes.length}`);
  });

  const shutdown = async () => {
    server.close();
    await database.close();
    process.exit(0);
  };
  process.on('SIGINT', () => { void shutdown(); });
  process.on('SIGTERM', () => { void shutdown(); });
}

main().catch((error) => {
  console.error(error instanceof Error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
