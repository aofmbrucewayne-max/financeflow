import Dexie, { type EntityTable } from 'dexie';
import type {
  Account,
  Category,
  Transaction,
  RecurringRule,
  SavingsGoal,
  Budget,
  Tag,
  ExchangeRateCache,
  UserSettings,
} from './types';

export class FinanceDB extends Dexie {
  accounts!: EntityTable<Account, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  recurringRules!: EntityTable<RecurringRule, 'id'>;
  savingsGoals!: EntityTable<SavingsGoal, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  tags!: EntityTable<Tag, 'id'>;
  exchangeRates!: EntityTable<ExchangeRateCache, 'id'>;
  settings!: EntityTable<UserSettings, 'id'>;

  constructor() {
    super('FinanceFlow');
    this.version(1).stores({
      accounts: 'id, type, currency, isArchived, createdAt',
      categories: 'id, type, parentId, isArchived, sortOrder',
      transactions: 'id, type, accountId, categoryId, date, createdAt',
      recurringRules: 'id, type, accountId, categoryId, isActive, nextDueDate',
      savingsGoals: 'id, isCompleted, createdAt',
      budgets: 'id, categoryId, month',
      tags: 'id, name',
      exchangeRates: '++id, baseCurrency',
      settings: '++id',
    });
  }
}

export const db = new FinanceDB();
