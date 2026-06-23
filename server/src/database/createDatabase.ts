import { Pool } from 'pg';
import type { DatabaseService, JsonObject } from '../types.js';
import { maskDatabaseUrl } from '../config/loadRunnerConfig.js';

export function createDatabase(databaseUrl: string): DatabaseService {
  const pool = new Pool({ connectionString: databaseUrl });

  return {
    connectionString: databaseUrl,
    connectionStringMasked: maskDatabaseUrl(databaseUrl),
    async query<T extends JsonObject = JsonObject>(text: string, values: unknown[] = []) {
      const result = await pool.query<T>(text, values);
      return { rows: result.rows, rowCount: result.rowCount };
    },
    async health() {
      try {
        await pool.query('select 1 as ok');
        return { ok: true, message: 'PostgreSQL connection succeeded.' };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, message };
      }
    },
    async close() {
      await pool.end();
    },
  };
}
