import type { Transaction } from '../types';

/**
 * Calculate the balance for a single account from a list of transactions.
 * Formula: initialBalance + income - expenses - transfersOut + transfersIn
 */
export function getAccountBalance(
  accountId: string,
  initialBalance: number,
  transactions: Transaction[],
): number {
  let total = 0;
  for (const tx of transactions) {
    if (tx.accountId === accountId) {
      if (tx.type === 'income') total += tx.amount;
      else if (tx.type === 'expense') total -= tx.amount;
      else if (tx.type === 'transfer') total -= tx.amount;
    }
    if (tx.type === 'transfer' && tx.toAccountId === accountId) {
      total += tx.amount;
    }
  }
  return initialBalance + total;
}
