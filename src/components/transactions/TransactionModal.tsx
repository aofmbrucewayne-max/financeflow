'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import type { Transaction } from '@/lib/types';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { useCategories } from '@/lib/hooks/useCategories';
import { toDateString } from '@/lib/utils/dates';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
}

type TransactionType = 'income' | 'expense' | 'transfer';

const defaultForm = {
  type: 'expense' as TransactionType,
  amount: '',
  currency: 'USD',
  accountId: '',
  toAccountId: '',
  categoryId: '',
  subcategoryId: '',
  note: '',
  date: toDateString(new Date()),
  tags: '' as string,
};

export function TransactionModal({ isOpen, onClose, editingId }: TransactionModalProps) {
  const accounts = useAccounts();
  const allCategories = useCategories();
  const [form, setForm] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editingId;

  // Load existing transaction for editing
  useEffect(() => {
    if (!isOpen) return;
    if (editingId) {
      db.transactions.get(editingId).then((tx) => {
        if (!tx) return;
        setForm({
          type: tx.type as TransactionType,
          amount: String(tx.amount),
          currency: tx.currency,
          accountId: tx.accountId,
          toAccountId: tx.toAccountId ?? '',
          categoryId: tx.categoryId,
          subcategoryId: tx.subcategoryId ?? '',
          note: tx.note,
          date: tx.date,
          tags: tx.tags.join(', '),
        });
      });
    } else {
      setForm({
        ...defaultForm,
        accountId: accounts?.[0]?.id ?? '',
        currency: accounts?.[0]?.currency ?? 'USD',
      });
    }
  }, [isOpen, editingId, accounts]);

  // Sync currency with selected account
  useEffect(() => {
    if (!form.accountId || isEditing) return;
    const account = accounts?.find((a) => a.id === form.accountId);
    if (account) {
      setForm((prev) => ({ ...prev, currency: account.currency }));
    }
  }, [form.accountId, accounts, isEditing]);

  const parentCategories = allCategories?.filter(
    (c) => c.parentId === null && form.type !== 'transfer' && c.type === (form.type as 'income' | 'expense'),
  ) ?? [];

  const subcategories = allCategories?.filter(
    (c) => c.parentId === form.categoryId,
  ) ?? [];

  const handleSave = async () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!form.accountId) {
      toast.error('Please select an account');
      return;
    }
    if (form.type !== 'transfer' && !form.categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (form.type === 'transfer' && !form.toAccountId) {
      toast.error('Please select a destination account');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const txData: Transaction = {
        id: editingId ?? uuidv4(),
        type: form.type,
        amount: Number(form.amount),
        currency: form.currency,
        amountInBase: Number(form.amount), // simplified – same as amount for now
        exchangeRate: 1,
        accountId: form.accountId,
        toAccountId: form.type === 'transfer' ? form.toAccountId : undefined,
        categoryId: form.categoryId || 'uncategorized',
        subcategoryId: form.subcategoryId || undefined,
        tags,
        note: form.note,
        date: form.date,
        isRecurring: false,
        createdAt: isEditing ? '' : now,
        updatedAt: now,
      };

      if (isEditing) {
        const existing = await db.transactions.get(editingId!);
        txData.createdAt = existing?.createdAt ?? now;
        await db.transactions.put(txData);
        toast.success('Transaction updated');
      } else {
        await db.transactions.add(txData);
        toast.success('Transaction added');
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const typeColors: Record<TransactionType, string> = {
    income: '#22c55e',
    expense: '#ef4444',
    transfer: '#3b82f6',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #2a2a40' }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#e8e8f0' }}>
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#8888a0' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#22223a';
              (e.currentTarget as HTMLElement).style.color = '#e8e8f0';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#8888a0';
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Type Tabs */}
          <div
            className="flex rounded-xl p-1"
            style={{ backgroundColor: '#0a0a0f' }}
          >
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    type: t,
                    categoryId: '',
                    subcategoryId: '',
                  }))
                }
                className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                style={
                  form.type === t
                    ? {
                        backgroundColor: typeColors[t] + '20',
                        color: typeColors[t],
                        border: `1px solid ${typeColors[t]}40`,
                      }
                    : { color: '#8888a0' }
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              Amount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="flex-1 px-4 py-3 rounded-xl text-xl font-semibold outline-none transition-colors"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a40',
                  color: typeColors[form.type],
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = '#7c3aed';
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = '#2a2a40';
                }}
              />
              <select
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                className="px-3 py-3 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a40',
                  color: '#e8e8f0',
                  minWidth: '80px',
                }}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              {form.type === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <select
              value={form.accountId}
              onChange={(e) => setForm((prev) => ({ ...prev, accountId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a40',
                color: '#e8e8f0',
              }}
            >
              <option value="">Select account</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.currency})
                </option>
              ))}
            </select>
          </div>

          {/* To Account (Transfer only) */}
          {form.type === 'transfer' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
                To Account
              </label>
              <select
                value={form.toAccountId}
                onChange={(e) => setForm((prev) => ({ ...prev, toAccountId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a40',
                  color: '#e8e8f0',
                }}
              >
                <option value="">Select destination account</option>
                {accounts
                  ?.filter((a) => a.id !== form.accountId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Category & Subcategory */}
          {form.type !== 'transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                      subcategoryId: '',
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2a2a40',
                    color: '#e8e8f0',
                  }}
                >
                  <option value="">Select category</option>
                  {parentCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
                  Subcategory
                </label>
                <select
                  value={form.subcategoryId}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subcategoryId: e.target.value }))
                  }
                  disabled={subcategories.length === 0}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
                  style={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2a2a40',
                    color: '#e8e8f0',
                  }}
                >
                  <option value="">None</option>
                  {subcategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a40',
                color: '#e8e8f0',
                colorScheme: 'dark',
              }}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              Note
            </label>
            <textarea
              placeholder="Add a note..."
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a40',
                color: '#e8e8f0',
              }}
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = '#7c3aed';
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = '#2a2a40';
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              Tags (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. vacation, work, groceries"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a40',
                color: '#e8e8f0',
              }}
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = '#7c3aed';
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = '#2a2a40';
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #2a2a40' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: '#1a1a2e',
              color: '#8888a0',
              border: '1px solid #2a2a40',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#22223a';
              (e.currentTarget as HTMLElement).style.color = '#e8e8f0';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1a2e';
              (e.currentTarget as HTMLElement).style.color = '#8888a0';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
            onMouseEnter={(e) => {
              if (!isSaving) (e.currentTarget as HTMLElement).style.backgroundColor = '#6d28d9';
            }}
            onMouseLeave={(e) => {
              if (!isSaving) (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed';
            }}
          >
            <Plus className="w-4 h-4" />
            {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
