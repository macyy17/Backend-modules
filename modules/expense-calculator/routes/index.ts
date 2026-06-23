import type { ModuleRegisterContext } from '../../../server/src/types';

export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  context.addRoute('GET', '/expenses', async () => {
    const result = await context.database.query('SELECT id, name, amount, category, date FROM expenses ORDER BY date DESC');
    return { status: 200, body: { expenses: result.rows } };
  }, { description: 'Get all expenses.' });

  context.addRoute('GET', '/expenses/total', async () => {
    const result = await context.database.query('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses');
    return { status: 200, body: { total: Number(result.rows[0]?.total || 0) } };
  }, { description: 'Get the total sum.' });
}
