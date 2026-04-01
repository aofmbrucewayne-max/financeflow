import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { Account, Transaction, Budget, SavingsGoal } from '../types';

function rnd(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export async function seedDemoData(): Promise<void> {
  // Clear existing data except categories
  await db.transactions.clear();
  await db.accounts.clear();
  await db.budgets.clear();
  await db.savingsGoals.clear();

  const now = new Date().toISOString();

  // ── ACCOUNTS ───────────────────────────────────────────────
  const bankId = uuidv4();
  const cashId = uuidv4();
  const ccId = uuidv4();
  const savingsId = uuidv4();

  const accounts: Account[] = [
    {
      id: bankId, name: 'Main Checking', type: 'bank',
      currency: 'USD', initialBalance: 3200, color: '#3b82f6',
      icon: '🏦', isArchived: false, createdAt: now, updatedAt: now,
    },
    {
      id: cashId, name: 'Cash Wallet', type: 'cash',
      currency: 'USD', initialBalance: 200, color: '#22c55e',
      icon: '💵', isArchived: false, createdAt: now, updatedAt: now,
    },
    {
      id: ccId, name: 'Credit Card', type: 'credit_card',
      currency: 'USD', initialBalance: 0, color: '#ef4444',
      icon: '💳', isArchived: false, createdAt: now, updatedAt: now,
    },
    {
      id: savingsId, name: 'Savings Account', type: 'bank',
      currency: 'USD', initialBalance: 8000, color: '#7c3aed',
      icon: '🏧', isArchived: false, createdAt: now, updatedAt: now,
    },
  ];
  await db.accounts.bulkAdd(accounts);

  // ── LOAD CATEGORIES ────────────────────────────────────────
  const allCats = await db.categories.toArray();
  const getcat = (name: string) => allCats.find((c) => c.name === name);

  const salaryId = getcat('Salary')?.id;
  const freelanceId = getcat('Freelance')?.id;
  const investId = getcat('Investments')?.id;
  const foodId = getcat('Food & Dining')?.id;
  const housingId = getcat('Housing')?.id;
  const transportId = getcat('Transport')?.id;
  const entertainId = getcat('Entertainment')?.id;
  const healthId = getcat('Health')?.id;
  const shoppingId = getcat('Shopping')?.id;
  const subsId = getcat('Subscriptions')?.id;
  const billsId = getcat('Bills')?.id;
  const savingsCatId = getcat('Savings')?.id;

  const fallback = allCats[0]?.id ?? 'unknown';
  const f = (id?: string) => id ?? fallback;

  // ── TRANSACTIONS — 12 MONTHS ───────────────────────────────
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed

  const transactions: Transaction[] = [];

  for (let m = 1; m <= 12; m++) {
    // skip future months
    const year = currentYear;
    if (m > currentMonth) continue;
    const days = daysInMonth(year, m);
    const isCurrentMonth = m === currentMonth;
    const lastDay = isCurrentMonth ? today.getDate() : days;

    // 1. Monthly salary (1st of month)
    transactions.push({
      id: uuidv4(), type: 'income',
      amount: rnd(4200, 4800), currency: 'USD',
      amountInBase: 0, exchangeRate: 1,
      accountId: bankId, categoryId: f(salaryId),
      tags: ['salary'], note: 'Monthly salary',
      date: dateStr(year, m, 1), isRecurring: true,
      createdAt: now, updatedAt: now,
    });

    // 2. Freelance income (random month, 60% chance)
    if (Math.random() > 0.4) {
      transactions.push({
        id: uuidv4(), type: 'income',
        amount: rnd(400, 1800), currency: 'USD',
        amountInBase: 0, exchangeRate: 1,
        accountId: bankId, categoryId: f(freelanceId),
        tags: ['freelance'], note: pick(['Web project', 'Design work', 'Consulting', 'Side project']),
        date: dateStr(year, m, pick([5, 10, 15, 20])),
        isRecurring: false, createdAt: now, updatedAt: now,
      });
    }

    // 3. Investment return (quarterly, months 3/6/9/12)
    if ([3, 6, 9, 12].includes(m) && m <= currentMonth) {
      transactions.push({
        id: uuidv4(), type: 'income',
        amount: rnd(150, 600), currency: 'USD',
        amountInBase: 0, exchangeRate: 1,
        accountId: savingsId, categoryId: f(investId),
        tags: ['investments'], note: 'Dividend / return',
        date: dateStr(year, m, pick([10, 15, 20])),
        isRecurring: false, createdAt: now, updatedAt: now,
      });
    }

    // 4. Rent (monthly, 2nd)
    transactions.push({
      id: uuidv4(), type: 'expense',
      amount: 1350, currency: 'USD',
      amountInBase: 0, exchangeRate: 1,
      accountId: bankId, categoryId: f(housingId),
      tags: ['rent', 'housing'], note: 'Monthly rent',
      date: dateStr(year, m, 2), isRecurring: true,
      createdAt: now, updatedAt: now,
    });

    // 5. Utilities (monthly, 5th)
    transactions.push({
      id: uuidv4(), type: 'expense',
      amount: rnd(90, 160), currency: 'USD',
      amountInBase: 0, exchangeRate: 1,
      accountId: bankId, categoryId: f(billsId),
      tags: ['utilities'], note: pick(['Electricity bill', 'Gas + water', 'Internet bill']),
      date: dateStr(year, m, 5), isRecurring: true,
      createdAt: now, updatedAt: now,
    });

    // 6. Subscriptions (monthly, 8th)
    const subs = [
      { note: 'Netflix', amount: 15.99 },
      { note: 'Spotify', amount: 9.99 },
      { note: 'Adobe CC', amount: 54.99 },
      { note: 'GitHub Pro', amount: 4 },
    ];
    for (const sub of subs) {
      transactions.push({
        id: uuidv4(), type: 'expense',
        amount: sub.amount, currency: 'USD',
        amountInBase: 0, exchangeRate: 1,
        accountId: ccId, categoryId: f(subsId),
        tags: ['subscription'], note: sub.note,
        date: dateStr(year, m, 8), isRecurring: true,
        createdAt: now, updatedAt: now,
      });
    }

    // 7. Phone bill (monthly, 10th)
    transactions.push({
      id: uuidv4(), type: 'expense',
      amount: rnd(45, 75), currency: 'USD',
      amountInBase: 0, exchangeRate: 1,
      accountId: bankId, categoryId: f(billsId),
      tags: ['phone'], note: 'Phone bill',
      date: dateStr(year, m, 10), isRecurring: true,
      createdAt: now, updatedAt: now,
    });

    // 8. Transfer to savings (15th)
    transactions.push({
      id: uuidv4(), type: 'transfer',
      amount: rnd(300, 600), currency: 'USD',
      amountInBase: 0, exchangeRate: 1,
      accountId: bankId, toAccountId: savingsId,
      categoryId: f(savingsCatId),
      tags: ['savings'], note: 'Monthly savings transfer',
      date: dateStr(year, m, 15), isRecurring: true,
      createdAt: now, updatedAt: now,
    });

    // 9. Variable daily spending (groceries, food, transport)
    const expensePool = [
      { cat: foodId, notes: ['Groceries', 'Supermarket run', 'Whole Foods', 'Trader Joe\'s'], min: 40, max: 120, acct: bankId },
      { cat: foodId, notes: ['Restaurant dinner', 'Lunch with colleagues', 'Sushi night', 'Pizza night', 'Brunch'], min: 18, max: 75, acct: ccId },
      { cat: foodId, notes: ['Coffee & pastry', 'Starbucks', 'Morning coffee'], min: 5, max: 15, acct: cashId },
      { cat: transportId, notes: ['Uber ride', 'Lyft', 'Taxi'], min: 12, max: 35, acct: ccId },
      { cat: transportId, notes: ['Metro card', 'Bus pass', 'Public transit'], min: 30, max: 50, acct: cashId },
      { cat: transportId, notes: ['Gas station', 'Fuel up'], min: 45, max: 80, acct: ccId },
      { cat: entertainId, notes: ['Cinema tickets', 'Movie night', 'Theater'], min: 20, max: 45, acct: ccId },
      { cat: entertainId, notes: ['Bar with friends', 'Happy hour', 'Drinks out'], min: 30, max: 80, acct: cashId },
      { cat: shoppingId, notes: ['Amazon order', 'Online shopping', 'H&M', 'Zara'], min: 25, max: 150, acct: ccId },
      { cat: healthId, notes: ['Pharmacy', 'Doctor visit', 'Gym membership'], min: 20, max: 120, acct: bankId },
    ];

    // generate ~18-25 spending entries per month
    const numEntries = Math.floor(rnd(18, 25));
    for (let i = 0; i < numEntries; i++) {
      const day = Math.floor(rnd(1, lastDay));
      const item = pick(expensePool);
      const ds = dateStr(year, m, day);
      transactions.push({
        id: uuidv4(), type: 'expense',
        amount: rnd(item.min, item.max), currency: 'USD',
        amountInBase: 0, exchangeRate: 1,
        accountId: item.acct, categoryId: f(item.cat),
        tags: [], note: pick(item.notes),
        date: ds, isRecurring: false,
        createdAt: now, updatedAt: now,
      });
    }
  }

  // Fix amountInBase = amount (all USD for demo)
  transactions.forEach((tx) => { tx.amountInBase = tx.amount; });

  await db.transactions.bulkAdd(transactions);

  // ── BUDGETS (current month) ────────────────────────────────
  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const budgetDefs = [
    { catId: foodId, amount: 600 },
    { catId: housingId, amount: 1400 },
    { catId: transportId, amount: 250 },
    { catId: entertainId, amount: 200 },
    { catId: shoppingId, amount: 300 },
    { catId: healthId, amount: 150 },
    { catId: subsId, amount: 100 },
    { catId: billsId, amount: 200 },
  ];
  const budgets = budgetDefs
    .filter((b) => b.catId)
    .map((b) => ({
      id: uuidv4(),
      categoryId: f(b.catId),
      amount: b.amount,
      currency: 'USD',
      month: monthKey,
      alertThreshold: 80,
      createdAt: now,
      updatedAt: now,
    }));
  await db.budgets.bulkAdd(budgets);

  // ── SAVINGS GOALS ──────────────────────────────────────────
  const goals: SavingsGoal[] = [
    {
      id: uuidv4(), name: 'Emergency Fund',
      targetAmount: 10000, currentAmount: 6500,
      currency: 'USD', deadline: `${currentYear + 1}-06-30`,
      color: '#22c55e', icon: '🛡️',
      isCompleted: false, createdAt: now, updatedAt: now,
    },
    {
      id: uuidv4(), name: 'Japan Vacation',
      targetAmount: 3500, currentAmount: 1200,
      currency: 'USD', deadline: `${currentYear + 1}-03-01`,
      color: '#ec4899', icon: '✈️',
      isCompleted: false, createdAt: now, updatedAt: now,
    },
    {
      id: uuidv4(), name: 'New MacBook Pro',
      targetAmount: 2499, currentAmount: 2100,
      currency: 'USD', deadline: `${currentYear}-12-31`,
      color: '#3b82f6', icon: '💻',
      isCompleted: false, createdAt: now, updatedAt: now,
    },
    {
      id: uuidv4(), name: 'Down Payment',
      targetAmount: 50000, currentAmount: 12400,
      currency: 'USD',
      color: '#7c3aed', icon: '🏠',
      isCompleted: false, createdAt: now, updatedAt: now,
    },
  ];
  await db.savingsGoals.bulkAdd(goals);
}
