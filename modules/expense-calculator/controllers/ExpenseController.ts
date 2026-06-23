import type { ModuleHandlerResult, ModuleRequest } from '../../../server/src/types.js';
import { ExpenseService } from '../services/ExpenseService.js';
import type { AddExpenseRequest } from '../types/ExpenseTypes.js';

/**
 * Helper function to extract string value from request data
 */
function string_value(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Helper function to extract number value from request data
 */
function number_value(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  return typeof value === 'number' ? value : NaN;
}

/**
 * Parse and validate the add expense request payload
 */
function parse_add_expense_request(request: ModuleRequest): AddExpenseRequest {
  const source = request.method.toUpperCase() === 'GET'
    ? request.query
    : request.body && typeof request.body === 'object' && !Array.isArray(request.body)
      ? request.body as Record<string, unknown>
      : {};

  const name = string_value(source, 'name').trim();
  const amount = number_value(source, 'amount');
  const category = string_value(source, 'category').trim();
  const date = string_value(source, 'date').trim();

  if (!name) throw new Error('Expense name is required.');
  if (isNaN(amount)) throw new Error('Expense amount is required and must be a number.');
  if (!category) throw new Error('Expense category is required.');
  if (!date) throw new Error('Expense date is required.');

  return { name, amount, category, date };
}

/**
 * ExpenseController handles HTTP requests related to expense management
 * Routes requests to the ExpenseService and formats responses
 */
export class ExpenseController {
  constructor(private readonly expense_service: ExpenseService) {}

  /**
   * Handler for adding a new expense
   * Accepts GET with query params or POST with JSON body
   */
  async addExpense(request: ModuleRequest): Promise<ModuleHandlerResult> {
    let payload: AddExpenseRequest;

    try {
      payload = parse_add_expense_request(request);
    } catch (error) {
      return {
        status: 422,
        body: {
          error: {
            code: 'VALIDATION_FAILED',
            message: error instanceof Error ? error.message : 'Invalid request.',
            details: {
              fields: ['name', 'amount', 'category', 'date'],
            },
          },
        },
      };
    }

    try {
      const response = this.expense_service.addExpense(payload);
      return {
        status: 201,
        body: response,
      };
    } catch (error) {
      return {
        status: 400,
        body: {
          error: {
            code: 'ADD_EXPENSE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to add expense.',
            details: {},
          },
        },
      };
    }
  }

  /**
   * Handler for removing an expense by ID
   * Uses query parameter "id" to identify the expense
   */
  async removeExpense(request: ModuleRequest): Promise<ModuleHandlerResult> {
    try {
      const expenseId = string_value(request.query, 'id');
      if (!expenseId) {
        throw new Error('Expense ID is required (use ?id=<expense-id>).');
      }

      const response = this.expense_service.removeExpense(expenseId);
      return {
        status: 200,
        body: response,
      };
    } catch (error) {
      return {
        status: error instanceof Error && error.message.includes('not found') ? 404 : 400,
        body: {
          error: {
            code: 'REMOVE_EXPENSE_FAILED',
            message: error instanceof Error ? error.message : 'Failed to remove expense.',
            details: {},
          },
        },
      };
    }
  }

  /**
   * Handler for getting all expenses
   */
  async getExpenses(request: ModuleRequest): Promise<ModuleHandlerResult> {
    try {
      const response = this.expense_service.getAllExpenses();
      return {
        status: 200,
        body: response,
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          error: {
            code: 'GET_EXPENSES_FAILED',
            message: error instanceof Error ? error.message : 'Failed to retrieve expenses.',
            details: {},
          },
        },
      };
    }
  }

  /**
   * Handler for calculating total expenses
   */
  async getTotal(request: ModuleRequest): Promise<ModuleHandlerResult> {
    try {
      const response = this.expense_service.calculateTotal();
      return {
        status: 200,
        body: response,
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          error: {
            code: 'CALCULATE_TOTAL_FAILED',
            message: error instanceof Error ? error.message : 'Failed to calculate total.',
            details: {},
          },
        },
      };
    }
  }

  /**
   * Handler for getting expenses by category
   */
  async getByCategory(request: ModuleRequest): Promise<ModuleHandlerResult> {
    try {
      const response = this.expense_service.getExpensesByCategory();
      return {
        status: 200,
        body: response,
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          error: {
            code: 'GET_BY_CATEGORY_FAILED',
            message: error instanceof Error ? error.message : 'Failed to retrieve expenses by category.',
            details: {},
          },
        },
      };
    }
  }
}
