'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { format, addMonths, subMonths } from 'date-fns';
import { db } from '@/lib/db';
import { useBudgets } from '@/lib/hooks/useBudgets';
import { formatCurrency } from '@/lib/utils/currency';

function BudgetModal({
  isOpen,
  onClose,
  month,
}: {
  isOpen: boolean;
  onClose: () => void;
  month: string;
}) {
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [isSaving, setIsSaving] = useState(false);

  const categories = useLiveQuery(() =>
    db.categories
      .filter(item => !item.isArchived)
      .toArray()
      .then(cats => cats.filter(c => c.type === 'expense' && c.parentId === null))
  );

  const handleSave = async () => {
    if (!categoryId) { toast.error('Select a category'); return; }
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await db.budgets.add({
        id: uuidv4(),
        categoryId,
        amount: Number(amount),
        currency: 'USD',
        month,
        alertThreshold: Number(alertThreshold),
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Budget created');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #2a2a40' }}>
          <h2 className="text-base font-semibold" style={{ color: '#e8e8f0' }}>New Budget</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#8888a0' }}><X className="w-4 h-4" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
            >
              <option value="">Select category</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Budget Amount (USD)</label>
            <input
              type="number" min="0" step="0.01" placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>
              Alert at {alertThreshold}% of budget
            </label>
            <input
              type="range" min="10" max="100" step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full accent-purple-600"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #2a2a40' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: '#1a1a2e', color: '#8888a0', border: '1px solid #2a2a40' }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
          >
            {isSaving ? 'Saving...' : 'Create Budget'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);

  const monthKey = format(currentDate, 'yyyy-MM');
  const monthLabel = format(currentDate, 'MMMM yyyy');

  const budgets = useBudgets(monthKey);

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Delete this budget?')) {
      await db.budgets.delete(id);
      toast.success('Budget deleted');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>Budgets</h1>
          <p className="text-sm mt-0.5" style={{ color: '#8888a0' }}>Monthly spending limits</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#6d28d9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed'; }}
        >
          <Plus className="w-4 h-4" />
          Add Budget
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          className="p-2 rounded-xl transition-colors"
          style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40', color: '#8888a0' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1a2e'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#12121a'; }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold px-2" style={{ color: '#e8e8f0' }}>{monthLabel}</span>
        <button
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          className="p-2 rounded-xl transition-colors"
          style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40', color: '#8888a0' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1a1a2e'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#12121a'; }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      {budgets && budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Budgeted', value: formatCurrency(budgets.reduce((s, b) => s + b.amount, 0), 'USD'), color: '#7c3aed' },
            { label: 'Total Spent', value: formatCurrency(budgets.reduce((s, b) => s + b.spent, 0), 'USD'), color: '#ef4444' },
            { label: 'Remaining', value: formatCurrency(budgets.reduce((s, b) => s + Math.max(0, b.remaining), 0), 'USD'), color: '#22c55e' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl p-4" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}>
              <p className="text-xs" style={{ color: '#8888a0' }}>{item.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Budget Cards */}
      {budgets === undefined ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }} />
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ backgroundColor: '#1a1a2e' }}>📊</div>
          <p className="text-base font-medium" style={{ color: '#e8e8f0' }}>No budgets for {monthLabel}</p>
          <p className="text-sm mt-1 mb-4" style={{ color: '#555570' }}>Create a budget to track your spending</p>
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}>
            <Plus className="w-4 h-4" />
            Add First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const isOverBudget = budget.spent > budget.amount;
            const isWarning = budget.percentage >= budget.alertThreshold && !isOverBudget;
            const barColor = isOverBudget ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';

            return (
              <div
                key={budget.id}
                className="group rounded-2xl p-5 flex flex-col gap-3"
                style={{ backgroundColor: '#12121a', border: `1px solid ${isOverBudget ? '#ef444440' : '#2a2a40'}` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: (budget.category?.color ?? '#7c3aed') + '20' }}
                    >
                      {budget.category?.icon ?? '💰'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>
                        {budget.category?.name ?? 'Unknown'}
                      </p>
                      {isOverBudget && (
                        <span className="text-xs" style={{ color: '#ef4444' }}>Over budget!</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBudget(budget.id)}
                    className="p-2 md:p-1.5 rounded-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    style={{ color: '#f87171', backgroundColor: '#ef444418' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444430'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444418'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs" style={{ color: '#555570' }}>
                      {formatCurrency(budget.spent, budget.currency)} spent
                    </span>
                    <span className="text-xs font-medium" style={{ color: barColor }}>
                      {budget.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a2e' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(budget.percentage, 100)}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#555570' }}>
                    Budget: {formatCurrency(budget.amount, budget.currency)}
                  </span>
                  <span className="text-xs font-medium" style={{ color: budget.remaining >= 0 ? '#22c55e' : '#ef4444' }}>
                    {budget.remaining >= 0 ? `${formatCurrency(budget.remaining, budget.currency)} left` : `${formatCurrency(Math.abs(budget.remaining), budget.currency)} over`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetModal isOpen={modalOpen} onClose={() => setModalOpen(false)} month={monthKey} />
    </div>
  );
}
