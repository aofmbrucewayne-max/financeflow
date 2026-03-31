'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Search, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { db } from '@/lib/db';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { TransactionRow } from '@/components/transactions/TransactionRow';

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export default function TransactionsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [accountFilter, setAccountFilter] = useState('');

  const accounts = useLiveQuery(() =>
    db.accounts.filter(item => !item.isArchived).toArray(),
  );
  const categories = useLiveQuery(() => db.categories.toArray());

  const transactions = useLiveQuery(async () => {
    let all = await db.transactions.orderBy('date').reverse().toArray();
    if (typeFilter !== 'all') all = all.filter((tx) => tx.type === typeFilter);
    if (accountFilter) all = all.filter((tx) => tx.accountId === accountFilter);
    if (dateFrom) all = all.filter((tx) => tx.date >= dateFrom);
    if (dateTo) all = all.filter((tx) => tx.date <= dateTo);
    if (search) {
      const q = search.toLowerCase();
      all = all.filter(
        (tx) =>
          tx.note.toLowerCase().includes(q) ||
          tx.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return all;
  }, [typeFilter, accountFilter, dateFrom, dateTo, search]);

  const categoryMap = new Map(categories?.map((c) => [c.id, c]) ?? []);
  const accountMap = new Map(accounts?.map((a) => [a.id, a]) ?? []);

  // Group by date
  const grouped: Record<string, typeof transactions> = {};
  transactions?.forEach((tx) => {
    if (!grouped[tx.date]) grouped[tx.date] = [];
    grouped[tx.date]!.push(tx);
  });
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const handleDelete = async (id: string) => {
    if (confirm('Delete this transaction?')) {
      await db.transactions.delete(id);
    }
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const filterTypes: { label: string; value: FilterType; color: string }[] = [
    { label: 'All', value: 'all', color: '#8888a0' },
    { label: 'Income', value: 'income', color: '#22c55e' },
    { label: 'Expense', value: 'expense', color: '#ef4444' },
    { label: 'Transfer', value: 'transfer', color: '#3b82f6' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>
            Transactions
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#8888a0' }}>
            {transactions?.length ?? 0} transaction{(transactions?.length ?? 0) !== 1 ? 's' : ''}
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
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
      >
        {/* Type toggles */}
        <div className="flex gap-2 flex-wrap">
          {filterTypes.map((ft) => (
            <button
              key={ft.value}
              onClick={() => setTypeFilter(ft.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={
                typeFilter === ft.value
                  ? { backgroundColor: ft.color + '20', color: ft.color, border: `1px solid ${ft.color}40` }
                  : { backgroundColor: '#1a1a2e', color: '#8888a0', border: '1px solid transparent' }
              }
            >
              {ft.label}
            </button>
          ))}
        </div>

        {/* Search & other filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl" style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40' }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: '#555570' }} />
            <input
              type="text"
              placeholder="Search notes, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: '#e8e8f0' }}
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none"
            style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0', colorScheme: 'dark' }}
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none"
            style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0', colorScheme: 'dark' }}
            placeholder="To"
          />
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none"
            style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
          >
            <option value="">All Accounts</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List */}
      {transactions === undefined ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
        </div>
      ) : transactions.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ backgroundColor: '#1a1a2e' }}>
            💸
          </div>
          <p className="text-base font-medium" style={{ color: '#e8e8f0' }}>
            No transactions found
          </p>
          <p className="text-sm mt-1" style={{ color: '#555570' }}>
            {search || typeFilter !== 'all' || accountFilter ? 'Try adjusting your filters' : 'Add your first transaction'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {dates.map((date) => {
            const dayTxs = grouped[date] ?? [];
            let dateLabel = '';
            try {
              dateLabel = format(parseISO(date), 'EEEE, MMMM d, yyyy');
            } catch {
              dateLabel = date;
            }
            const dayTotal = dayTxs.reduce((s, tx) => {
              if (tx.type === 'income') return s + tx.amount;
              if (tx.type === 'expense') return s - tx.amount;
              return s;
            }, 0);

            return (
              <div key={date} className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}>
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: '1px solid #2a2a40', backgroundColor: '#0a0a0f' }}
                >
                  <span className="text-xs font-medium" style={{ color: '#8888a0' }}>
                    {dateLabel}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: dayTotal >= 0 ? '#22c55e' : '#ef4444' }}
                  >
                    {dayTotal >= 0 ? '+' : ''}{dayTotal.toFixed(2)}
                  </span>
                </div>
                <div className="px-2 py-1">
                  {dayTxs.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      category={categoryMap.get(tx.categoryId)}
                      account={accountMap.get(tx.accountId)}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => { setEditingId(null); setModalOpen(true); }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all z-30"
        style={{ backgroundColor: '#7c3aed' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#6d28d9';
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed';
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        }}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        editingId={editingId}
      />
    </div>
  );
}
