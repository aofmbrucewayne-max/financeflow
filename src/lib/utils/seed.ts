import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { Category, UserSettings } from '../types';

const expenseCategories: Omit<Category, 'id'>[] = [
  {
    name: 'Food & Dining',
    type: 'expense',
    icon: '🍽️',
    color: '#f59e0b',
    parentId: null,
    isCustom: false,
    sortOrder: 1,
    isArchived: false,
  },
  {
    name: 'Housing',
    type: 'expense',
    icon: '🏠',
    color: '#3b82f6',
    parentId: null,
    isCustom: false,
    sortOrder: 2,
    isArchived: false,
  },
  {
    name: 'Transport',
    type: 'expense',
    icon: '🚗',
    color: '#8b5cf6',
    parentId: null,
    isCustom: false,
    sortOrder: 3,
    isArchived: false,
  },
  {
    name: 'Entertainment',
    type: 'expense',
    icon: '🎮',
    color: '#ec4899',
    parentId: null,
    isCustom: false,
    sortOrder: 4,
    isArchived: false,
  },
  {
    name: 'Health',
    type: 'expense',
    icon: '❤️',
    color: '#ef4444',
    parentId: null,
    isCustom: false,
    sortOrder: 5,
    isArchived: false,
  },
  {
    name: 'Shopping',
    type: 'expense',
    icon: '🛍️',
    color: '#f97316',
    parentId: null,
    isCustom: false,
    sortOrder: 6,
    isArchived: false,
  },
  {
    name: 'Education',
    type: 'expense',
    icon: '📚',
    color: '#06b6d4',
    parentId: null,
    isCustom: false,
    sortOrder: 7,
    isArchived: false,
  },
  {
    name: 'Travel',
    type: 'expense',
    icon: '✈️',
    color: '#14b8a6',
    parentId: null,
    isCustom: false,
    sortOrder: 8,
    isArchived: false,
  },
  {
    name: 'Subscriptions',
    type: 'expense',
    icon: '📱',
    color: '#6366f1',
    parentId: null,
    isCustom: false,
    sortOrder: 9,
    isArchived: false,
  },
  {
    name: 'Bills',
    type: 'expense',
    icon: '📄',
    color: '#64748b',
    parentId: null,
    isCustom: false,
    sortOrder: 10,
    isArchived: false,
  },
  {
    name: 'Savings',
    type: 'expense',
    icon: '🏦',
    color: '#22c55e',
    parentId: null,
    isCustom: false,
    sortOrder: 11,
    isArchived: false,
  },
];

const incomeCategories: Omit<Category, 'id'>[] = [
  {
    name: 'Salary',
    type: 'income',
    icon: '💼',
    color: '#22c55e',
    parentId: null,
    isCustom: false,
    sortOrder: 1,
    isArchived: false,
  },
  {
    name: 'Freelance',
    type: 'income',
    icon: '💻',
    color: '#3b82f6',
    parentId: null,
    isCustom: false,
    sortOrder: 2,
    isArchived: false,
  },
  {
    name: 'Investments',
    type: 'income',
    icon: '📈',
    color: '#8b5cf6',
    parentId: null,
    isCustom: false,
    sortOrder: 3,
    isArchived: false,
  },
  {
    name: 'Gifts Received',
    type: 'income',
    icon: '🎁',
    color: '#ec4899',
    parentId: null,
    isCustom: false,
    sortOrder: 4,
    isArchived: false,
  },
  {
    name: 'Other Income',
    type: 'income',
    icon: '💰',
    color: '#f59e0b',
    parentId: null,
    isCustom: false,
    sortOrder: 5,
    isArchived: false,
  },
];

type SubcategoryDef = {
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
};

const subcategories: Record<string, SubcategoryDef[]> = {
  'Food & Dining': [
    { name: 'Restaurant', icon: '🍴', color: '#f59e0b', sortOrder: 1 },
    { name: 'Groceries', icon: '🛒', color: '#f59e0b', sortOrder: 2 },
    { name: 'Coffee', icon: '☕', color: '#f59e0b', sortOrder: 3 },
    { name: 'Delivery', icon: '🛵', color: '#f59e0b', sortOrder: 4 },
  ],
  Housing: [
    { name: 'Rent', icon: '🏡', color: '#3b82f6', sortOrder: 1 },
    { name: 'Utilities', icon: '💡', color: '#3b82f6', sortOrder: 2 },
    { name: 'Maintenance', icon: '🔧', color: '#3b82f6', sortOrder: 3 },
  ],
  Transport: [
    { name: 'Fuel', icon: '⛽', color: '#8b5cf6', sortOrder: 1 },
    { name: 'Public Transit', icon: '🚇', color: '#8b5cf6', sortOrder: 2 },
    { name: 'Parking', icon: '🅿️', color: '#8b5cf6', sortOrder: 3 },
    { name: 'Ride-share', icon: '🚕', color: '#8b5cf6', sortOrder: 4 },
  ],
};

export async function seedDefaultData(): Promise<void> {
  const existingCategories = await db.categories.count();
  if (existingCategories > 0) return;

  const now = new Date().toISOString();

  // Seed expense parent categories
  const expenseCategoryMap: Record<string, string> = {};
  for (const cat of expenseCategories) {
    const id = uuidv4();
    expenseCategoryMap[cat.name] = id;
    await db.categories.add({ ...cat, id });
  }

  // Seed income parent categories
  for (const cat of incomeCategories) {
    const id = uuidv4();
    await db.categories.add({ ...cat, id });
  }

  // Seed subcategories
  for (const [parentName, subs] of Object.entries(subcategories)) {
    const parentId = expenseCategoryMap[parentName];
    if (!parentId) continue;
    const parentCat = expenseCategories.find((c) => c.name === parentName);
    for (const sub of subs) {
      await db.categories.add({
        id: uuidv4(),
        name: sub.name,
        type: 'expense',
        icon: sub.icon,
        color: sub.color,
        parentId,
        isCustom: false,
        sortOrder: sub.sortOrder,
        isArchived: false,
      });
    }
  }

  // Seed default settings
  const existingSettings = await db.settings.count();
  if (existingSettings === 0) {
    const defaultSettings: UserSettings = {
      baseCurrency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      weekStartsOn: 'monday',
      budgetResetDay: 1,
      showCents: true,
    };
    await db.settings.add(defaultSettings);
  }

  void now; // suppress unused var
}
