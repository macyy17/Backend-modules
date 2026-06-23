import type { Expense, AddExpenseRequest, AddExpenseResponse, RemoveExpenseResponse, GetExpensesResponse, GetTotalResponse, GetByCategory } from '../types/ExpenseTypes.js';
import { ExpenseRepository } from '../repositories/ExpenseRepository.js';

/**
 * ExpenseService handles business logic for expense management using PostgreSQL.
 */
export class ExpenseService {
  constructor(private readonly repository: ExpenseRepository) {}

  async addExpense(payload: AddExpenseRequest): Promise<AddExpenseResponse> {
    this.validateExpensePayload(payload);
    const expense = await this.repository.createExpense(payload);
    return {
      success: true,
      expense,
    };
  }

  async removeExpense(expenseId: string): Promise<RemoveExpenseResponse> {
    if (!expenseId || !expenseId.trim()) {
      throw new Error('Expense ID is required.');
    }

    const existing = await this.repository.getExpenseById(expenseId);
    if (!existing) {
      throw new Error(`Expense with ID "${expenseId}" not found.`);
    }

    await this.repository.deleteExpense(expenseId);
    return {
      success: true,
      message: `Expense with ID "${expenseId}" has been removed.`,
    };
  }

  async getAllExpenses(): Promise<GetExpensesResponse> {
    const expenses = await this.repository.getAllExpenses();
    return {
      expenses,
      count: expenses.length,
    };
  }

  async calculateTotal(): Promise<GetTotalResponse> {
    const total = await this.repository.getTotal();
    return {
      total: Math.round(total * 100) / 100,
      currency: 'USD',
    };
  }

  async getExpensesByCategory(): Promise<GetByCategory> {
    return this.repository.getExpensesByCategory();
  }

  private validateExpensePayload(payload: AddExpenseRequest): void {
    if (!payload.name || !payload.name.trim()) {
      throw new Error('Expense name is required.');
    }

    if (payload.amount === undefined || payload.amount === null) {
      throw new Error('Expense amount is required.');
    }

    if (typeof payload.amount !== 'number' || payload.amount <= 0) {
      throw new Error('Expense amount must be a positive number.');
    }

    if (!payload.category || !payload.category.trim()) {
      throw new Error('Expense category is required.');
    }

    if (!payload.date || !payload.date.trim()) {
      throw new Error('Expense date is required.');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
      throw new Error('Date must be in ISO format (YYYY-MM-DD).');
    }
  }
}
