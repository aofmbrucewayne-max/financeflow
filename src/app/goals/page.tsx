'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import { formatCurrency, SUPPORTED_CURRENCIES } from '@/lib/utils/currency';
import type { SavingsGoal } from '@/lib/types';

const GOAL_ICONS = ['🎯', '🏖️', '🚗', '🏠', '✈️', '💻', '💍', '🎓', '🏋️', '💰', '🏦', '🛡️'];
const COLOR_SWATCHES = [
  '#7c3aed', '#3b82f6', '#22c55e', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#f97316',
];

const defaultForm = {
  name: '',
  targetAmount: '',
  currentAmount: '',
  currency: 'USD',
  deadline: '',
  color: '#7c3aed',
  icon: '🎯',
};

export default function GoalsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const goals = useLiveQuery(() => db.savingsGoals.orderBy('createdAt').reverse().toArray());

  const active = goals?.filter((g) => !g.isCompleted) ?? [];
  const completed = goals?.filter((g) => g.isCompleted) ?? [];

  const openNew = () => {
    setEditingId(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      currency: goal.currency,
      deadline: goal.deadline ?? '',
      color: goal.color,
      icon: goal.icon,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Enter a goal name'); return; }
    if (!form.targetAmount || Number(form.targetAmount) <= 0) { toast.error('Enter a valid target amount'); return; }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const data: SavingsGoal = {
        id: editingId ?? uuidv4(),
        name: form.name.trim(),
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount) || 0,
        currency: form.currency,
        deadline: form.deadline || undefined,
        color: form.color,
        icon: form.icon,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
      };

      if (editingId) {
        const existing = await db.savingsGoals.get(editingId);
        data.createdAt = existing?.createdAt ?? now;
        data.isCompleted = existing?.isCompleted ?? false;
        await db.savingsGoals.put(data);
        toast.success('Goal updated');
      } else {
        await db.savingsGoals.add(data);
        toast.success('Goal created');
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save goal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this goal?')) {
      await db.savingsGoals.delete(id);
      toast.success('Goal deleted');
    }
  };

  const handleComplete = async (goal: SavingsGoal) => {
    await db.savingsGoals.update(goal.id, { isCompleted: true, updatedAt: new Date().toISOString() });
    toast.success('Goal marked as completed!');
  };

  const handleAddFunds = async (goal: SavingsGoal, amount: number) => {
    const newAmount = goal.currentAmount + amount;
    const isCompleted = newAmount >= goal.targetAmount;
    await db.savingsGoals.update(goal.id, {
      currentAmount: newAmount,
      isCompleted,
      updatedAt: new Date().toISOString(),
    });
    if (isCompleted) toast.success(`🎉 Goal "${goal.name}" completed!`);
    else toast.success(`Added ${formatCurrency(amount, goal.currency)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>Savings Goals</h1>
          <p className="text-sm mt-0.5" style={{ color: '#8888a0' }}>
            {active.length} active goal{active.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#7c3aed', color: '#fff' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#6d28d9'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed'; }}
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Active Goals */}
      {active.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4" style={{ backgroundColor: '#1a1a2e' }}>
            🎯
          </div>
          <p className="text-base font-medium" style={{ color: '#e8e8f0' }}>No goals yet</p>
          <p className="text-sm mt-1 mb-4" style={{ color: '#555570' }}>Set a savings goal and track your progress</p>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#7c3aed', color: '#fff' }}
          >
            <Plus className="w-4 h-4" /> Create First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {active.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => openEdit(goal)}
              onDelete={() => handleDelete(goal.id)}
              onComplete={() => handleComplete(goal)}
              onAddFunds={(amt) => handleAddFunds(goal, amt)}
            />
          ))}
        </div>
      )}

      {/* Completed Goals */}
      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-2 text-sm mb-3"
            style={{ color: '#8888a0' }}
          >
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            {showCompleted ? 'Hide' : 'Show'} completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-60">
              {completed.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => openEdit(goal)}
                  onDelete={() => handleDelete(goal.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl"
            style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #2a2a40' }}>
              <h2 className="text-base font-semibold" style={{ color: '#e8e8f0' }}>
                {editingId ? 'Edit Goal' : 'New Goal'}
              </h2>
              <button onClick={() => setModalOpen(false)} style={{ color: '#8888a0' }}>✕</button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Fund"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
                />
              </div>

              {/* Amounts + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Target Amount</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.targetAmount}
                    onChange={(e) => setForm((p) => ({ ...p, targetAmount: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Already Saved</label>
                  <input
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.currentAmount}
                    onChange={(e) => setForm((p) => ({ ...p, currentAmount: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
                    onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
                    onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Deadline (optional)</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0', colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Icon</label>
                <div className="flex flex-wrap gap-2">
                  {GOAL_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm((p) => ({ ...p, icon }))}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={form.icon === icon
                        ? { backgroundColor: '#7c3aed30', border: '2px solid #7c3aed' }
                        : { backgroundColor: '#1a1a2e', border: '2px solid transparent' }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888a0' }}>Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_SWATCHES.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm((p) => ({ ...p, color }))}
                      className="w-7 h-7 rounded-lg transition-all"
                      style={{ backgroundColor: color, outline: form.color === color ? `2px solid ${color}` : 'none', outlineOffset: '2px' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid #2a2a40' }}>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: '#1a1a2e', color: '#8888a0', border: '1px solid #2a2a40' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: '#7c3aed', color: '#fff' }}
              >
                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  onComplete,
  onAddFunds,
}: {
  goal: SavingsGoal;
  onEdit: () => void;
  onDelete: () => void;
  onComplete?: () => void;
  onAddFunds?: (amount: number) => void;
}) {
  const [addInput, setAddInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
    : null;
  const barColor = pct >= 100 ? '#22c55e' : pct >= 66 ? '#7c3aed' : pct >= 33 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ backgroundColor: goal.color + '20' }}>
            {goal.icon}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>{goal.name}</p>
            <p className="text-xs" style={{ color: '#555570' }}>
              {goal.currency}
              {daysLeft !== null && (
                <span style={{ color: daysLeft < 0 ? '#ef4444' : daysLeft < 30 ? '#f59e0b' : '#555570' }}>
                  {' '}· {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onEdit} className="p-2 md:p-1.5 rounded-lg transition-colors"
            style={{ color: '#c0c0d8', backgroundColor: '#22223a' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a40'; (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22223a'; (e.currentTarget as HTMLElement).style.color = '#c0c0d8'; }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-2 md:p-1.5 rounded-lg transition-colors"
            style={{ color: '#f87171', backgroundColor: '#ef444418' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444430'; (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444418'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span style={{ color: '#8888a0' }}>Progress</span>
          <span className="font-semibold" style={{ color: barColor }}>{pct.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a2e' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: barColor }}
          />
        </div>
      </div>

      {/* Amounts comparison */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl p-2.5" style={{ backgroundColor: '#1a1a2e' }}>
          <p className="text-xs mb-0.5" style={{ color: '#555570' }}>Saved</p>
          <p className="text-sm font-bold" style={{ color: '#22c55e' }}>{formatCurrency(goal.currentAmount, goal.currency)}</p>
        </div>
        <div className="rounded-xl p-2.5" style={{ backgroundColor: '#1a1a2e' }}>
          <p className="text-xs mb-0.5" style={{ color: '#555570' }}>Target</p>
          <p className="text-sm font-bold" style={{ color: '#e8e8f0' }}>{formatCurrency(goal.targetAmount, goal.currency)}</p>
        </div>
        <div className="rounded-xl p-2.5" style={{ backgroundColor: '#1a1a2e' }}>
          <p className="text-xs mb-0.5" style={{ color: '#555570' }}>Needed</p>
          <p className="text-sm font-bold" style={{ color: remaining > 0 ? '#f59e0b' : '#22c55e' }}>
            {remaining > 0 ? formatCurrency(remaining, goal.currency) : '✓ Done'}
          </p>
        </div>
      </div>

      {/* Add funds */}
      {!goal.isCompleted && onAddFunds && (
        <div>
          {showAdd ? (
            <div className="flex gap-2">
              <input
                type="number" min="0" step="0.01" placeholder="Amount"
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', color: '#e8e8f0' }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = '#7c3aed'; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = '#2a2a40'; }}
                autoFocus
              />
              <button
                onClick={() => {
                  const amt = Number(addInput);
                  if (amt > 0) { onAddFunds(amt); setAddInput(''); setShowAdd(false); }
                }}
                className="px-3 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}
              >
                Add
              </button>
              <button
                onClick={() => { setShowAdd(false); setAddInput(''); }}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ backgroundColor: '#1a1a2e', color: '#8888a0' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(true)}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
                style={{ backgroundColor: '#7c3aed20', color: '#7c3aed', border: '1px solid #7c3aed40' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed30'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed20'; }}
              >
                + Add Funds
              </button>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
                  style={{ backgroundColor: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22c55e30'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22c55e20'; }}
                >
                  Mark Complete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
