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
  fee: '',
  currency: 'USD',
  accountId: '',
  toAccountId: '',
  categoryId: '',
  subcategoryId: '',
  note: '',
  date: toDateString(new Date()),
  tags: '' as string,
};

const inputStyle = {
  width: '100%',
  backgroundColor: '#1a1a2e',
  border: '1px solid #2a2a40',
  color: '#e8e8f0',
  borderRadius: '12px',
  padding: '10px 12px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export function TransactionModal({ isOpen, onClose, editingId }: TransactionModalProps) {
  const accounts = useAccounts();
  const allCategories = useCategories();
  const [form, setForm] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editingId;

  useEffect(() => {
    if (!isOpen) return;
    if (editingId) {
      db.transactions.get(editingId).then((tx) => {
        if (!tx) return;
        setForm({
          type: tx.type as TransactionType,
          amount: String(tx.amount),
          fee: tx.fee ? String(tx.fee) : '',
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

  useEffect(() => {
    if (!form.accountId || isEditing) return;
    const account = accounts?.find((a) => a.id === form.accountId);
    if (account) setForm((prev) => ({ ...prev, currency: account.currency }));
  }, [form.accountId, accounts, isEditing]);

  const parentCategories = allCategories?.filter(
    (c) => c.parentId === null && form.type !== 'transfer' && c.type === (form.type as 'income' | 'expense'),
  ) ?? [];

  const subcategories = allCategories?.filter((c) => c.parentId === form.categoryId) ?? [];

  const handleSave = async () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      toast.error('Please enter a valid amount'); return;
    }
    if (!form.accountId) { toast.error('Please select an account'); return; }
    if (form.type !== 'transfer' && !form.categoryId) { toast.error('Please select a category'); return; }
    if (form.type === 'transfer' && !form.toAccountId) { toast.error('Please select a destination account'); return; }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const feeAmount = form.type === 'transfer' && form.fee ? Number(form.fee) : 0;
      const txData: Transaction = {
        id: editingId ?? uuidv4(),
        type: form.type,
        amount: Number(form.amount),
        currency: form.currency,
        amountInBase: Number(form.amount),
        exchangeRate: 1,
        accountId: form.accountId,
        toAccountId: form.type === 'transfer' ? form.toAccountId : undefined,
        fee: feeAmount > 0 ? feeAmount : undefined,
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
        // Remove old fee transaction if any, then recreate
        await db.transactions.where('note').equals(`Fee: ${txData.note || 'Transfer'} [auto]`).and(t => t.date === txData.date && t.type === 'expense').delete();
        toast.success('Transaction updated');
      } else {
        await db.transactions.add(txData);
        toast.success('Transaction added');
      }

      // Auto-create fee expense if transfer has a fee
      if (feeAmount > 0) {
        const feeCat = await db.categories.filter(c => c.name === 'Fees & Commissions' && !c.isArchived).first();
        let feeCatId = feeCat?.id;
        if (!feeCatId) {
          feeCatId = uuidv4();
          await db.categories.add({
            id: feeCatId,
            name: 'Fees & Commissions',
            type: 'expense',
            icon: '💸',
            color: '#f43f5e',
            parentId: null,
            isCustom: false,
            sortOrder: 99,
            isArchived: false,
          });
        }
        await db.transactions.add({
          id: uuidv4(),
          type: 'expense',
          amount: feeAmount,
          currency: form.currency,
          amountInBase: feeAmount,
          exchangeRate: 1,
          accountId: form.accountId,
          categoryId: feeCatId,
          tags: ['fee'],
          note: `Fee: ${form.note || 'Transfer'} [auto]`,
          date: form.date,
          isRecurring: false,
          createdAt: now,
          updatedAt: now,
        });
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet slides up from bottom on mobile, centered on desktop */}
      <div
        className="w-full sm:max-w-lg sm:mx-4 sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40', maxHeight: '92dvh' }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#3a3a55' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #2a2a40' }}>
          <h2 className="text-base font-semibold" style={{ color: '#e8e8f0' }}>
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: '#8888a0' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: 'calc(92dvh - 130px)' }}>

          {/* Type Tabs */}
          <div className="flex rounded-xl p-1 gap-1" style={{ backgroundColor: '#0a0a0f' }}>
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => setForm((prev) => ({ ...prev, type: t, categoryId: '', subcategoryId: '' }))}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all"
                style={
                  form.type === t
                    ? { backgroundColor: typeColors[t] + '22', color: typeColors[t], border: `1px solid ${typeColors[t]}44` }
                    : { color: '#8888a0' }
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount — full width input, currency below on same row but fixed */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                style={{
                  ...inputStyle,
                  flex: 1,
                  fontSize: '22px',
                  fontWeight: 700,
                  padding: '12px 14px',
                  color: typeColors[form.type],
                }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
              />
              <select
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                style={{
                  ...inputStyle,
                  width: '90px',
                  flex: 'none',
                  padding: '12px 10px',
                  fontWeight: 600,
                }}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
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
              style={inputStyle}
            >
              <option value="">Select account</option>
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
              ))}
            </select>
          </div>

          {/* To Account — transfer only */}
          {form.type === 'transfer' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>To Account</label>
              <select
                value={form.toAccountId}
                onChange={(e) => setForm((prev) => ({ ...prev, toAccountId: e.target.value }))}
                style={inputStyle}
              >
                <option value="">Select destination account</option>
                {accounts?.filter((a) => a.id !== form.accountId).map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                ))}
              </select>
            </div>
          )}

          {/* Fee — transfer only */}
          {form.type === 'transfer' && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
                Fee / Commission <span style={{ color: '#555570' }}>(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.fee}
                  onChange={(e) => setForm((prev) => ({ ...prev, fee: e.target.value }))}
                  style={{
                    ...inputStyle,
                    flex: 1,
                    color: form.fee && Number(form.fee) > 0 ? '#f43f5e' : '#e8e8f0',
                  }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
                />
                <div
                  className="flex items-center gap-1.5 px-3 rounded-xl text-xs shrink-0"
                  style={{ backgroundColor: '#f43f5e15', color: '#f43f5e', border: '1px solid #f43f5e30' }}
                >
                  💸 Fees
                </div>
              </div>
              {form.fee && Number(form.fee) > 0 && (
                <p className="text-xs mt-1.5" style={{ color: '#555570' }}>
                  Will be tracked as expense under &quot;Fees &amp; Commissions&quot;
                </p>
              )}
            </div>
          )}

          {/* Category + Subcategory */}
          {form.type !== 'transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
                  style={inputStyle}
                >
                  <option value="">Select</option>
                  {parentCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Subcategory</label>
                <select
                  value={form.subcategoryId}
                  onChange={(e) => setForm((prev) => ({ ...prev, subcategoryId: e.target.value }))}
                  disabled={subcategories.length === 0}
                  style={{ ...inputStyle, opacity: subcategories.length === 0 ? 0.5 : 1 }}
                >
                  <option value="">None</option>
                  {subcategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
              style={{ ...inputStyle, colorScheme: 'dark' }}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Note</label>
            <textarea
              placeholder="Add a note..."
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="vacation, work, groceries"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
              style={inputStyle}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4" style={{ borderTop: '1px solid #2a2a40' }}>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#1a1a2e', color: '#8888a0', border: '1px solid #2a2a40' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" />
            {isSaving ? 'Saving…' : isEditing ? 'Update' : 'Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
