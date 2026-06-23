import fs from 'node:fs';
import path from 'node:path';
import type { ModuleRegisterContext } from '../../../server/src/types.js';
import { ExpenseController } from '../controllers/ExpenseController.js';
import { ExpenseRepository } from '../repositories/ExpenseRepository.js';
import { ExpenseService } from '../services/ExpenseService.js';

async function applyExpenseSchema(context: ModuleRegisterContext): Promise<void> {
  const migrationFile = path.join(context.selectedModule.path, 'db/migrations/001_create_expenses_table.sql');
  const seederFile = path.join(context.selectedModule.path, 'db/seeders/001_seed_expenses.sql');

  if (fs.existsSync(migrationFile)) {
    await context.database.query(fs.readFileSync(migrationFile, 'utf8'));
  }

  if (fs.existsSync(seederFile)) {
    await context.database.query(fs.readFileSync(seederFile, 'utf8'));
  }
}

/**
 * Register all expense calculator routes
 * This function is called by the module runner to set up the API endpoints
 */
export async function registerRoutes(context: ModuleRegisterContext): Promise<void> {
  await applyExpenseSchema(context);

  const expense_repository = new ExpenseRepository(context.database);
  const expense_service = new ExpenseService(expense_repository);
  const expense_controller = new ExpenseController(expense_service);

  const addExpense = expense_controller.addExpense.bind(expense_controller);
  const removeExpense = expense_controller.removeExpense.bind(expense_controller);
  const getExpenses = expense_controller.getExpenses.bind(expense_controller);
  const getTotal = expense_controller.getTotal.bind(expense_controller);
  const getByCategory = expense_controller.getByCategory.bind(expense_controller);

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
