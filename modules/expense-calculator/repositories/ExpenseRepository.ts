import type { DatabaseService } from '../../../server/src/types';
import type { ExpenseCategoryTotal, ExpenseInput, ExpenseRecord, ExpenseTotal } from '../types/ExpenseTypes';

type ExpenseRow = {
  id: string;
  name: string;
  amount: string | number;
  category: string;
  date?: string;
  spent_on?: string;
  created_at?: string;
};

function to_expense_record(row: ExpenseRow): ExpenseRecord {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    category: row.category,
    date: String(row.date || row.spent_on || ''),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

export class ExpenseRepository {
  constructor(private readonly database: DatabaseService) {}

  async create(input: ExpenseInput): Promise<ExpenseRecord> {
    const result = await this.database.query<ExpenseRow>(
      `
      INSERT INTO expenses (name, amount, category, date)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, amount, category, date, created_at
      `,
      [input.name, input.amount, input.category, input.date],
    );

    return to_expense_record(result.rows[0]);
  }

  async list(): Promise<ExpenseRecord[]> {
    const result = await this.database.query<ExpenseRow>(
      'SELECT id, name, amount, category, date, created_at FROM expenses ORDER BY date DESC, created_at DESC',
    );

    return result.rows.map(to_expense_record);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.database.query('DELETE FROM expenses WHERE id = $1', [id]);
    return Number(result.rowCount || 0) > 0;
  }

  async total(): Promise<ExpenseTotal> {
    const result = await this.database.query<{ total: string | number }>('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses');
    return { total: Number(result.rows[0]?.total || 0) };
  }

  async byCategory(): Promise<ExpenseCategoryTotal[]> {
    const result = await this.database.query<{ category: string; total: string | number; count: string | number }>(
      'SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM expenses GROUP BY category ORDER BY category ASC',
    );

    return result.rows.map((row) => ({ category: row.category, total: Number(row.total), count: Number(row.count) }));
  }
}
