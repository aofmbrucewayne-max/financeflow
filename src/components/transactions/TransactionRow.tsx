'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { Transaction, Category, Account } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/lib/stores/themeStore';

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
  const c = useThemeStore((s) => s.colors);
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
        (e.currentTarget as HTMLElement).style.backgroundColor = c.bgTertiary;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
      }}
    >
      {/* Category Icon */}
      <div
        className="flex items-center justify-center w-10 h-10 rounded-xl text-lg shrink-0"
        style={{ backgroundColor: c.bgElevated }}
      >
        {category?.icon ?? (isTransfer ? '↔️' : '💳')}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            style={{ color: c.textPrimary }}
          >
            {isTransfer ? 'Transfer' : (category?.name ?? 'Uncategorized')}
          </span>
          {transaction.tags.length > 0 && (
            <div className="flex gap-1 hidden sm:flex">
              {transaction.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: c.bgElevated,
                    color: c.textSecondary,
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
              style={{ color: c.textSecondary }}
            >
              {transaction.note}
            </span>
          )}
          {showDate && (
            <span className="text-xs shrink-0" style={{ color: c.textTertiary }}>
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
            backgroundColor: c.bgElevated,
            color: c.textSecondary,
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

      {/* Actions — always visible on mobile, hover on desktop */}
      <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(transaction.id);
            }}
            className="p-2 md:p-1.5 rounded-lg transition-colors"
            style={{ color: c.textPrimary, backgroundColor: c.bgElevated }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = c.borderDefault;
              (e.currentTarget as HTMLElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = c.bgElevated;
              (e.currentTarget as HTMLElement).style.color = c.textPrimary;
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
            className="p-2 md:p-1.5 rounded-lg transition-colors"
            style={{ color: '#f87171', backgroundColor: '#ef444418' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444430';
              (e.currentTarget as HTMLElement).style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444418';
              (e.currentTarget as HTMLElement).style.color = '#f87171';
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
