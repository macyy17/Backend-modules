import { ExpenseRepository } from '../repositories/ExpenseRepository';
import type { ExpenseCategoryTotal, ExpenseInput, ExpenseRecord, ExpenseTotal } from '../types/ExpenseTypes';

export class ExpenseService {
  constructor(private readonly expense_repository: ExpenseRepository) {}

  async create(input: ExpenseInput): Promise<ExpenseRecord> {
    return this.expense_repository.create(input);
  }

  async list(): Promise<ExpenseRecord[]> {
    return this.expense_repository.list();
  }

  async remove(id: string): Promise<boolean> {
    return this.expense_repository.remove(id);
  }

  async total(): Promise<ExpenseTotal> {
    return this.expense_repository.total();
  }

  async byCategory(): Promise<ExpenseCategoryTotal[]> {
    return this.expense_repository.byCategory();
  }
}
