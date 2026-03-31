'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import type { Account } from '@/lib/types';
import { SUPPORTED_CURRENCIES } from '@/lib/utils/currency';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId?: string | null;
}

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' },
] as const;

const ACCOUNT_ICONS = ['🏦', '💵', '💳', '📈', '₿', '🏧', '💰', '🏡'];

const COLOR_SWATCHES = [
  '#7c3aed', '#3b82f6', '#22c55e', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6',
  '#f97316', '#14b8a6', '#64748b', '#a78bfa',
];

const defaultForm = {
  name: '',
  type: 'bank' as Account['type'],
  currency: 'USD',
  initialBalance: '0',
  color: '#7c3aed',
  icon: '🏦',
};

export function AccountModal({ isOpen, onClose, editingId }: AccountModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingId) {
      db.accounts.get(editingId).then((acc) => {
        if (!acc) return;
        setForm({
          name: acc.name,
          type: acc.type,
          currency: acc.currency,
          initialBalance: String(acc.initialBalance),
          color: acc.color,
          icon: acc.icon,
        });
      });
    } else {
      setForm(defaultForm);
    }
  }, [isOpen, editingId]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const accountData: Account = {
        id: editingId ?? uuidv4(),
        name: form.name.trim(),
        type: form.type,
        currency: form.currency,
        initialBalance: Number(form.initialBalance) || 0,
        color: form.color,
        icon: form.icon,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };

      if (editingId) {
        const existing = await db.accounts.get(editingId);
        accountData.createdAt = existing?.createdAt ?? now;
        await db.accounts.put(accountData);
        toast.success('Account updated');
      } else {
        await db.accounts.add(accountData);
        toast.success('Account created');
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save account');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #2a2a40' }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#e8e8f0' }}>
            {editingId ? 'Edit Account' : 'New Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ color: '#8888a0' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#22223a';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              Account Name
            </label>
            <input
              type="text"
              placeholder="e.g. Main Checking"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a40',
                color: '#e8e8f0',
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              Account Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as Account['type'] }))}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: '#1a1a2e',
                border: '1px solid #2a2a40',
                color: '#e8e8f0',
              }}
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency & Initial Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a40',
                  color: '#e8e8f0',
                }}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
                Initial Balance
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.initialBalance}
                onChange={(e) => setForm((prev) => ({ ...prev, initialBalance: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #2a2a40',
                  color: '#e8e8f0',
                }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
              />
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {ACCOUNT_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm((prev) => ({ ...prev, icon }))}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                  style={
                    form.icon === icon
                      ? { backgroundColor: '#7c3aed30', border: '2px solid #7c3aed' }
                      : { backgroundColor: '#1a1a2e', border: '2px solid transparent' }
                  }
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                  className="w-7 h-7 rounded-lg transition-all"
                  style={{
                    backgroundColor: color,
                    outline: form.color === color ? `2px solid ${color}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex gap-3 px-6 py-4"
          style={{ borderTop: '1px solid #2a2a40' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: '#1a1a2e',
              color: '#8888a0',
              border: '1px solid #2a2a40',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
            onMouseEnter={(e) => {
              if (!isSaving) (e.currentTarget as HTMLElement).style.backgroundColor = '#6d28d9';
            }}
            onMouseLeave={(e) => {
              if (!isSaving) (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed';
            }}
          >
            {isSaving ? 'Saving...' : editingId ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
