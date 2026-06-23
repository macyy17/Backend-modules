import { randomUUID } from 'crypto';
import type {
  Expense,
  AddExpenseRequest,
  AddExpenseResponse,
  RemoveExpenseResponse,
  GetExpensesResponse,
  GetTotalResponse,
  GetByCategory,
} from '../types/ExpenseTypes.js';

/**
 * ExpenseService handles all business logic for expense management
 * - Adding expenses
 * - Removing expenses
 * - Calculating totals
 * - Grouping by category
 */
export class ExpenseService {
  // In-memory storage for expenses (persists during app lifetime)
  private expenses: Map<string, Expense> = new Map();

  /**
   * Add a new expense
   * Validates that amount is positive and required fields are provided
   * Generates a unique ID for each expense
   *
   * @param payload - The expense data to add
   * @returns Object with success status and the created expense
   * @throws Error if validation fails
   */
  addExpense(payload: AddExpenseRequest): AddExpenseResponse {
    // Validate required fields
    if (!payload.name || !payload.name.trim()) {
      throw new Error('Expense name is required.');
    }

    if (payload.amount === undefined || payload.amount === null) {
      throw new Error('Expense amount is required.');
    }

    if (!payload.category || !payload.category.trim()) {
      throw new Error('Expense category is required.');
    }

    if (!payload.date || !payload.date.trim()) {
      throw new Error('Expense date is required.');
    }

    // Validate amount is positive
    if (typeof payload.amount !== 'number' || payload.amount <= 0) {
      throw new Error('Expense amount must be a positive number.');
    }

    // Validate date format (simple check for YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
      throw new Error('Date must be in ISO format (YYYY-MM-DD).');
    }

    // Create new expense with unique ID
    const expense: Expense = {
      id: randomUUID(),
      name: payload.name.trim(),
      amount: payload.amount,
      category: payload.category.trim(),
      date: payload.date,
    };

    // Store the expense
    this.expenses.set(expense.id, expense);

    return {
      success: true,
      expense,
    };
  }

  /**
   * Remove an expense by its ID
   *
   * @param expenseId - The unique identifier of the expense to remove
   * @returns Object with success status and confirmation message
   * @throws Error if expense not found
   */
  removeExpense(expenseId: string): RemoveExpenseResponse {
    if (!expenseId || !expenseId.trim()) {
      throw new Error('Expense ID is required.');
    }

    const exists = this.expenses.has(expenseId);
    if (!exists) {
      throw new Error(`Expense with ID "${expenseId}" not found.`);
    }

    this.expenses.delete(expenseId);

    return {
      success: true,
      message: `Expense with ID "${expenseId}" has been removed.`,
    };
  }

  /**
   * Get all expenses
   *
   * @returns Array of all expenses and their count
   */
  getAllExpenses(): GetExpensesResponse {
    const expenses = Array.from(this.expenses.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      expenses,
      count: expenses.length,
    };
  }

  /**
   * Calculate the total of all expenses
   *
   * @returns Total sum of all expenses
   */
  calculateTotal(): GetTotalResponse {
    let total = 0;

    for (const expense of this.expenses.values()) {
      total += expense.amount;
    }

    return {
      total: Math.round(total * 100) / 100, // Round to 2 decimal places
      currency: 'USD',
    };
  }

  /**
   * Get expenses grouped by category with totals for each category
   *
   * @returns Object with categories as keys and their expenses and totals as values
   */
  getExpensesByCategory(): GetByCategory {
    const result: GetByCategory = {};

    // Group expenses by category
    for (const expense of this.expenses.values()) {
      if (!result[expense.category]) {
        result[expense.category] = {
          total: 0,
          expenses: [],
          count: 0,
        };
      }

      result[expense.category].expenses.push(expense);
      result[expense.category].total += expense.amount;
      result[expense.category].count += 1;
    }

    // Round totals to 2 decimal places and sort expenses by date
    for (const category in result) {
      result[category].total = Math.round(result[category].total * 100) / 100;
      result[category].expenses.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    return result;
  }
}
