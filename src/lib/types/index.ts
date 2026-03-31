export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit_card' | 'investment' | 'crypto' | 'other';
  currency: string;
  initialBalance: number;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentId: string | null;
  isCustom: boolean;
  sortOrder: number;
  isArchived: boolean;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  amountInBase: number;
  exchangeRate: number;
  accountId: string;
  toAccountId?: string;
  categoryId: string;
  subcategoryId?: string;
  tags: string[];
  note: string;
  date: string;
  isRecurring: boolean;
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringRule {
  id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  accountId: string;
  categoryId: string;
  subcategoryId?: string;
  tags: string[];
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isActive: boolean;
  autoCreate: boolean;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline?: string;
  color: string;
  icon: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  currency: string;
  month: string; // YYYY-MM
  alertThreshold: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
}

export interface ExchangeRateCache {
  id?: number;
  baseCurrency: string;
  rates: Record<string, number>;
  fetchedAt: string;
}

export interface UserSettings {
  id?: number;
  baseCurrency: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  weekStartsOn: 'monday' | 'sunday';
  defaultAccountId?: string;
  budgetResetDay: number;
  showCents: boolean;
}
