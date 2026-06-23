import type { IncomingHttpHeaders } from 'node:http';

export type JsonObject = Record<string, unknown>;

export type EndpointPreset = {
  id: string;
  method: string;
  path: string;
  title: string;
  description: string;
  headers: JsonObject;
  cookies: JsonObject;
  query: JsonObject;
  body: unknown;
  response: unknown;
};

export type ModuleInfoJson = {
  name: string;
  title: string;
  description: string;
  endpoints: EndpointPreset[];
  raw?: unknown;
  warnings: string[];
};

export type ModuleEntry = {
  name: string;
  path: string;
  hasMarkdownInfo: boolean;
  hasJsonInfo: boolean;
};

export type LoadedModule = {
  name: string;
  path: string;
  moduleInfoMarkdown: string;
  moduleInfoJson: ModuleInfoJson;
};

export type RunnerConfig = {
  projectRoot: string;
  modulesRoot: string;
  selectedModuleName?: string;
  port: number;
  databaseUrl: string;
  databaseUrlMasked: string;
  envFilesLoaded: string[];
  moduleEnvPath?: string;
};

export type DatabaseService = {
  connectionString: string;
  connectionStringMasked: string;
  query<T extends JsonObject = JsonObject>(text: string, values?: unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
  health(): Promise<{ ok: boolean; message: string }>;
  close(): Promise<void>;
};

export type ModuleRequest = {
  method: string;
  path: string;
  headers: IncomingHttpHeaders | JsonObject;
  cookies: JsonObject;
  query: JsonObject;
  body: unknown;
  rawBody: string;
  params: Record<string, string>;
  database: DatabaseService;
  databaseUrl: string;
};

export type ModuleHandlerResult = {
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
};

export type ModuleRouteHandler = (request: ModuleRequest) => Promise<ModuleHandlerResult | unknown> | ModuleHandlerResult | unknown;

export type ModuleRoute = {
  method: string;
  path: string;
  description: string;
  handler: ModuleRouteHandler;
};

export type ModuleRegisterContext = {
  addRoute(method: string, path: string, handler: ModuleRouteHandler, options?: { description?: string }): void;
  database: DatabaseService;
  databaseUrl: string;
  selectedModule: LoadedModule;
  config: RunnerConfig;
};
