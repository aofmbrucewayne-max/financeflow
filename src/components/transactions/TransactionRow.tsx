'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { Transaction, Category, Account } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';

interface TransactionRowProps {
  transaction: Transaction;
  category?: Category;
  account?: Account;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showDate?: boolean;
}

export function TransactionRow({
  transaction,
  category,
  account,
  onEdit,
  onDelete,
  showDate = false,
}: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const isTransfer = transaction.type === 'transfer';

  const amountColor = isIncome
    ? '#22c55e'
    : isTransfer
    ? '#3b82f6'
    : '#ef4444';

  const amountPrefix = isIncome ? '+' : isTransfer ? '' : '-';

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-150 cursor-pointer"
      style={{ backgroundColor: 'transparent' }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1a2e';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      {/* Category Icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl text-lg shrink-0"
        style={{ backgroundColor: '#22223a' }}
      >
        {category?.icon ?? (isTransfer ? '↔️' : '💳')}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: '#e8e8f0' }}
          >
            {category?.name ?? 'Uncategorized'}
          </span>
          {transaction.tags.length > 0 && (
            <div className="flex gap-1 hidden sm:flex">
              {transaction.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: '#22223a',
                    color: '#8888a0',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {transaction.note && (
            <span
              className="text-xs truncate"
              style={{ color: '#8888a0' }}
            >
              {transaction.note}
            </span>
          )}
          {showDate && (
            <span className="text-xs shrink-0" style={{ color: '#555570' }}>
              {formatDate(transaction.date, 'MMM d')}
            </span>
          )}
        </div>
      </div>

      {/* Account Badge */}
      {account && (
        <span
          className="hidden sm:block text-xs px-2 py-1 rounded-lg shrink-0"
          style={{
            backgroundColor: '#22223a',
            color: '#8888a0',
          }}
        >
          {account.name}
        </span>
      )}

      {/* Amount */}
      <div className="text-right shrink-0">
        <span className="text-sm font-semibold" style={{ color: amountColor }}>
          {amountPrefix}
          {formatCurrency(transaction.amount, transaction.currency)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaction.id);
            }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#8888a0' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a40';
              (e.currentTarget as HTMLElement).style.color = '#e8e8f0';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#8888a0';
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction.id);
            }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#8888a0' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444420';
              (e.currentTarget as HTMLElement).style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#8888a0';
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
