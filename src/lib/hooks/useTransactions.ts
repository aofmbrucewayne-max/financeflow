import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Transaction } from '../types';

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  accountId?: string;
  categoryId?: string;
  type?: 'income' | 'expense' | 'transfer' | 'all';
  search?: string;
  limit?: number;
}

export function useTransactions(filters: TransactionFilters = {}): Transaction[] | undefined {
  return useLiveQuery(async () => {
    let query = db.transactions.orderBy('date').reverse();

    const results = await query.toArray();

    return results.filter((tx) => {
      if (filters.type && filters.type !== 'all' && tx.type !== filters.type) {
        return false;
      }
      if (filters.accountId && tx.accountId !== filters.accountId) {
        return false;
      }
      if (filters.categoryId && tx.categoryId !== filters.categoryId) {
        return false;
      }
      if (filters.dateFrom && tx.date < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && tx.date > filters.dateTo) {
        return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!(tx.note ?? '').toLowerCase().includes(q) && !(tx.tags ?? []).some((t) => t.toLowerCase().includes(q))) {
          return false;
        }
      }
      return true;
    }).slice(0, filters.limit ?? undefined);
  }, [
    filters.type,
    filters.accountId,
    filters.categoryId,
    filters.dateFrom,
    filters.dateTo,
    filters.search,
    filters.limit,
  ]);
}

