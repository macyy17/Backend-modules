/**
 * Expense data type with unique identifier, amount, category, name, and date
 */
export type Expense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string; // ISO format: YYYY-MM-DD
};

/**
 * Request payload for adding a new expense
 */
export type AddExpenseRequest = {
  name: string;
  amount: number;
  category: string;
  date: string; // ISO format: YYYY-MM-DD
};

/**
 * Response for adding an expense
 */
export type AddExpenseResponse = {
  success: boolean;
  expense: Expense;
};

/**
 * Response for removing an expense
 */
export type RemoveExpenseResponse = {
  success: boolean;
  message: string;
};

/**
 * Response for getting all expenses
 */
export type GetExpensesResponse = {
  expenses: Expense[];
  count: number;
};

/**
 * Response for calculating total expenses
 */
export type GetTotalResponse = {
  total: number;
  currency: string;
};

/**
 * Response for expenses grouped by category
 */
export type GetByCategory = {
  [category: string]: {
    total: number;
    expenses: Expense[];
    count: number;
  };
};
