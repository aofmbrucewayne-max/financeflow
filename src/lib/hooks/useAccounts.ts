import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Account } from '../types';

export function useAccounts(): Account[] | undefined {
  return useLiveQuery(() =>
    db.accounts.filter(item => !item.isArchived).sortBy('createdAt'),
  );
}

export function useAccount(id: string): Account | undefined {
  return useLiveQuery(() => db.accounts.get(id), [id]);
}
