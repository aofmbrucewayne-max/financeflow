import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Budget, Category } from '../types';
import { getCurrentMonthKey } from '../utils/dates';

export interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  category?: Category;
}

export function useBudgets(month?: string): BudgetWithSpending[] | undefined {
  const targetMonth = month ?? getCurrentMonthKey();

  return useLiveQuery(async () => {
    const budgets = await db.budgets.where('month').equals(targetMonth).toArray();
    if (budgets.length === 0) return [];

    const monthStart = `${targetMonth}-01`;
    const [y, mo] = targetMonth.split('-').map(Number);
    const monthEnd = `${targetMonth}-${String(new Date(y, mo, 0).getDate()).padStart(2, '0')}`;

    const transactions = await db.transactions
      .where('date')
      .between(monthStart, monthEnd, true, true)
      .toArray();

    const categories = await db.categories.toArray();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return budgets.map((budget) => {
      const spent = transactions
        .filter(
          (tx) =>
            tx.type === 'expense' &&
            (tx.categoryId === budget.categoryId ||
              tx.subcategoryId === budget.categoryId),
        )
        .reduce((sum, tx) => sum + tx.amountInBase, 0);

      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        remaining,
        percentage: Math.min(percentage, 100),
        category: categoryMap.get(budget.categoryId),
      };
    });
  }, [targetMonth]);
}
