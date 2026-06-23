import type { DatabaseService } from '../../../server/src/types.js';
import type { Expense } from '../types/ExpenseTypes.js';

export class ExpenseRepository {
  constructor(private readonly database: DatabaseService) {}

  async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const result = await this.database.query<Expense>(
      `INSERT INTO expenses (name, amount, category, date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, amount, category, date`,
      [expense.name, expense.amount, expense.category, expense.date]
    );

    return result.rows[0];
  }

  async deleteExpense(id: string): Promise<void> {
    await this.database.query(`DELETE FROM expenses WHERE id = $1`, [id]);
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const result = await this.database.query<Expense>(
      `SELECT id, name, amount, category, date FROM expenses WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  async getAllExpenses(): Promise<Expense[]> {
    const result = await this.database.query<Expense>(
      `SELECT id, name, amount, category, TO_CHAR(date, 'YYYY-MM-DD') AS date
       FROM expenses
       ORDER BY date DESC`,
      []
    );

    return result.rows.map((row) => ({ ...row, amount: Number(row.amount) }));
  }

  async getTotal(): Promise<number> {
    const result = await this.database.query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0)::text AS total FROM expenses`,
      []
    );

    return Number(result.rows[0]?.total || '0');
  }

  async getExpensesByCategory(): Promise<Record<string, { total: number; expenses: Expense[]; count: number }>> {
    const rows = await this.database.query<Expense & { total: string; count: number }>(
      `SELECT category,
              id,
              name,
              amount,
              TO_CHAR(date, 'YYYY-MM-DD') AS date,
              SUM(amount) OVER (PARTITION BY category) AS total,
              COUNT(*) OVER (PARTITION BY category) AS count
       FROM expenses
       ORDER BY category, date DESC`,
      []
    );

    const result: Record<string, { total: number; expenses: Expense[]; count: number }> = {};

    for (const row of rows.rows) {
      const category = row.category;
      if (!result[category]) {
        result[category] = {
          total: Number(row.total),
          expenses: [],
          count: Number(row.count),
        };
      }

      result[category].expenses.push({
        id: row.id,
        name: row.name,
        amount: Number(row.amount),
        category: row.category,
        date: row.date,
      });
    }

    return result;
  }
}
