import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Category } from '../types';

export interface CategoryTree extends Category {
  children: Category[];
}

export function useCategories(type?: 'income' | 'expense'): Category[] | undefined {
  return useLiveQuery(async () => {
    let query = db.categories.filter(item => !item.isArchived);
    const all = await query.toArray();
    if (type) {
      return all.filter((c) => c.type === type).sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return all.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [type]);
}

export function useCategoryTree(type?: 'income' | 'expense'): CategoryTree[] | undefined {
  return useLiveQuery(async () => {
    const all = await db.categories.filter(item => !item.isArchived).toArray();
    const filtered = type ? all.filter((c) => c.type === type) : all;

    const parents = filtered
      .filter((c) => c.parentId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return parents.map((parent) => ({
      ...parent,
      children: filtered
        .filter((c) => c.parentId === parent.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }));
  }, [type]);
}
