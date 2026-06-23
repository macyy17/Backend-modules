export type ExpenseInput = {
  name: string;
  amount: number;
  category: string;
  date: string;
};

export type ExpenseRecord = ExpenseInput & {
  id: string;
  createdAt?: string;
};

export type ExpenseTotal = {
  total: number;
};

export type ExpenseCategoryTotal = {
  category: string;
  total: number;
  count: number;
};
