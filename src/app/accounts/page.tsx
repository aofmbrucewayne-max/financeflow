'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { AccountModal } from '@/components/accounts/AccountModal';
import { formatCurrency } from '@/lib/utils/currency';
import type { Account } from '@/lib/types';

const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  bank: 'Bank',
  cash: 'Cash',
  credit_card: 'Credit Card',
  investment: 'Investment',
  crypto: 'Crypto',
  other: 'Other',
};

export default function AccountsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const accounts = useLiveQuery(() =>
    db.accounts.filter(item => !item.isArchived).sortBy('createdAt'),
  );

  const transactions = useLiveQuery(() => db.transactions.toArray());

  const getBalance = (accountId: string, initialBalance: number) => {
    const txTotal =
      transactions
        ?.filter((tx) => tx.accountId === accountId)
        .reduce((s, tx) => {
          if (tx.type === 'income') return s + tx.amount;
          if (tx.type === 'expense') return s - tx.amount;
          return s;
        }, 0) ?? 0;
    return initialBalance + txTotal;
  };

  const handleArchive = async (id: string) => {
    if (confirm('Archive this account? It will be hidden but not deleted.')) {
      await db.accounts.update(id, { isArchived: true, updatedAt: new Date().toISOString() });
      toast.success('Account archived');
    }
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>
            Accounts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#8888a0' }}>
            {accounts?.length ?? 0} active account{(accounts?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setEditingId(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#6d28d9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed'; }}
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Total Balance Banner */}
      {(accounts?.length ?? 0) > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #7c3aed20, #3b82f620)', border: '1px solid #7c3aed40' }}
        >
          <p className="text-sm font-medium" style={{ color: '#8888a0' }}>
            Total Balance
          </p>
          <p className="text-3xl font-bold mt-1" style={{ color: '#e8e8f0' }}>
            {formatCurrency(
              accounts?.reduce((s, acc) => s + getBalance(acc.id, acc.initialBalance), 0) ?? 0,
              'USD',
            )}
          </p>
          <p className="text-xs mt-1" style={{ color: '#555570' }}>
            Across all accounts
          </p>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts === undefined ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
        </div>
      ) : accounts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ backgroundColor: '#1a1a2e' }}>
            🏦
          </div>
          <p className="text-base font-medium" style={{ color: '#e8e8f0' }}>
            No accounts yet
          </p>
          <p className="text-sm mt-1 mb-4" style={{ color: '#555570' }}>
            Add an account to start tracking your finances
          </p>
          <button
            onClick={() => { setEditingId(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
          >
            <Plus className="w-4 h-4" />
            Add First Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const balance = getBalance(acc.id, acc.initialBalance);
            const txCount = transactions?.filter((tx) => tx.accountId === acc.id).length ?? 0;
            return (
              <div
                key={acc.id}
                className="group rounded-2xl p-5 flex flex-col gap-4 transition-all"
                style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#3a3a55';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#2a2a40';
                }}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: acc.color + '20' }}
                    >
                      {acc.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>
                        {acc.name}
                      </p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: acc.color + '20', color: acc.color }}
                      >
                        {ACCOUNT_TYPE_LABELS[acc.type]}
                      </span>
                    </div>
                  </div>
                  {/* Actions — always visible on mobile, hover on desktop */}
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(acc.id)}
                      className="p-2 md:p-1.5 rounded-lg transition-colors"
                      style={{ color: '#c0c0d8', backgroundColor: '#22223a' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a40'; (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22223a'; (e.currentTarget as HTMLElement).style.color = '#c0c0d8'; }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleArchive(acc.id)}
                      className="p-2 md:p-1.5 rounded-lg transition-colors"
                      style={{ color: '#f87171', backgroundColor: '#ef444418' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444430'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444418'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div>
                  <p className="text-xs mb-1" style={{ color: '#555570' }}>
                    Current Balance
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: balance >= 0 ? '#e8e8f0' : '#ef4444' }}
                  >
                    {formatCurrency(balance, acc.currency)}
                  </p>
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid #2a2a40' }}
                >
                  <span className="text-xs" style={{ color: '#555570' }}>
                    {txCount} transaction{txCount !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs" style={{ color: '#555570' }}>
                    {acc.currency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AccountModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        editingId={editingId}
      />
    </div>
  );
}
