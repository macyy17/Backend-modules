import type { ModuleRegisterContext } from '../../../server/src/types.js';
import { ExpenseController } from '../controllers/ExpenseController.js';
import { ExpenseService } from '../services/ExpenseService.js';

/**
 * Register all expense calculator routes
 * This function is called by the module runner to set up the API endpoints
 */
export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  // Initialize the service and controller
  const expense_service = new ExpenseService();
  const expense_controller = new ExpenseController(expense_service);

  // Bind methods to preserve 'this' context
  const addExpense = expense_controller.addExpense.bind(expense_controller);
  const removeExpense = expense_controller.removeExpense.bind(expense_controller);
  const getExpenses = expense_controller.getExpenses.bind(expense_controller);
  const getTotal = expense_controller.getTotal.bind(expense_controller);
  const getByCategory = expense_controller.getByCategory.bind(expense_controller);

  // Register routes
  context.addRoute('POST', '/expenses', addExpense, {
    description: 'Add a new expense with name, amount, category, and date.',
  });

  context.addRoute('GET', '/expenses', getExpenses, {
    description: 'Get all expenses.',
  });

  context.addRoute('DELETE', '/expenses', removeExpense, {
    description: 'Remove an expense by ID using ?id=<expense-id>.',
  });

  context.addRoute('GET', '/expenses/total', getTotal, {
    description: 'Get the total sum of all expenses.',
  });

  context.addRoute('GET', '/expenses/by-category', getByCategory, {
    description: 'Get expenses grouped by category with totals.',
  });
}
