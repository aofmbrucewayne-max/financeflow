'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { TrendingUp, TrendingDown, Wallet, Activity, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { db } from '@/lib/db';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { formatCurrency } from '@/lib/utils/currency';
import { getCurrentMonthKey } from '@/lib/utils/dates';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: '#8888a0' }}>
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>
          {value}
        </p>
        {subtext && (
          <p className="text-xs mt-0.5" style={{ color: '#555570' }}>
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

type ChartRange = 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'last_month';

const SHORTCUTS: { key: ChartRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
];

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

function getRangeDates(range: ChartRange): { start: string; end: string; title: string } {
  const today = new Date();
  switch (range) {
    case 'today':
      return { start: toDateStr(today), end: toDateStr(today), title: 'Today' };
    case 'yesterday': {
      const d = new Date(today); d.setDate(d.getDate() - 1);
      return { start: toDateStr(d), end: toDateStr(d), title: 'Yesterday' };
    }
    case '7d': {
      const d = new Date(today); d.setDate(d.getDate() - 6);
      return { start: toDateStr(d), end: toDateStr(today), title: 'Last 7 Days' };
    }
    case '30d': {
      const d = new Date(today); d.setDate(d.getDate() - 29);
      return { start: toDateStr(d), end: toDateStr(today), title: 'Last 30 Days' };
    }
    case 'this_month': {
      const start = `${toDateStr(today).slice(0, 7)}-01`;
      return { start, end: toDateStr(today), title: today.toLocaleString('default', { month: 'long', year: 'numeric' }) };
    }
    case 'last_month': {
      const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toDateStr(d), end: toDateStr(last), title: d.toLocaleString('default', { month: 'long', year: 'numeric' }) };
    }
  }
}

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>('this_month');

  const monthKey = getCurrentMonthKey();
  const monthStart = `${monthKey}-01`;
  const monthEnd = `${monthKey}-31`;

  const accounts = useLiveQuery(() =>
    db.accounts.filter(item => !item.isArchived).toArray(),
  );

  const allTransactions = useLiveQuery(() =>
    db.transactions.orderBy('date').reverse().toArray(),
  );

  const monthTransactions = useLiveQuery(() =>
    db.transactions
      .where('date')
      .between(monthStart, monthEnd, true, true)
      .toArray(),
  );

  const categories = useLiveQuery(() => db.categories.toArray());

  const categoryMap = new Map(categories?.map((c) => [c.id, c]) ?? []);
  const accountMap = new Map(accounts?.map((a) => [a.id, a]) ?? []);

  const totalBalance =
    accounts?.reduce((sum, acc) => {
      const txTotal =
        allTransactions
          ?.filter((tx) => tx.accountId === acc.id)
          .reduce((s, tx) => {
            if (tx.type === 'income') return s + tx.amount;
            if (tx.type === 'expense') return s - tx.amount;
            return s;
          }, 0) ?? 0;
      return sum + acc.initialBalance + txTotal;
    }, 0) ?? 0;

  const incomeThisMonth =
    monthTransactions
      ?.filter((tx) => tx.type === 'income')
      .reduce((s, tx) => s + tx.amountInBase, 0) ?? 0;

  const expensesThisMonth =
    monthTransactions
      ?.filter((tx) => tx.type === 'expense')
      .reduce((s, tx) => s + tx.amountInBase, 0) ?? 0;

  const net = incomeThisMonth - expensesThisMonth;
  const recentTransactions = allTransactions?.slice(0, 5) ?? [];
  const isLoading = accounts === undefined || allTransactions === undefined;

  const savingsGoals = useLiveQuery(() =>
    db.savingsGoals.filter((g) => !g.isCompleted).toArray(),
  );

  // Chart range
  const rangeDates = useMemo(() => getRangeDates(chartRange), [chartRange]);

  const chartTransactions = useLiveQuery(() =>
    db.transactions
      .where('date')
      .between(rangeDates.start, rangeDates.end, true, true)
      .toArray(),
    [rangeDates.start, rangeDates.end],
  );

  const dailyChartData = useMemo(() => {
    if (!chartTransactions) return [];
    const start = new Date(rangeDates.start);
    const end = new Date(rangeDates.end);
    const days: { label: string; date: string }[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, date: toDateStr(new Date(d)) });
    }
    let runningNet = 0;
    return days.map(({ label, date }) => {
      const dayTxs = chartTransactions.filter((tx) => tx.date === date);
      const income = dayTxs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amountInBase, 0);
      const expense = dayTxs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amountInBase, 0);
      runningNet += income - expense;
      return { label, income, expense, net: runningNet };
    });
  }, [chartTransactions, rangeDates]);

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this transaction?')) {
      await db.transactions.delete(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#7c3aed', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#8888a0' }}>
            Your financial overview
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingId(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444430'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444420'; }}
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
          <button
            onClick={() => { setEditingId(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22c55e30'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22c55e20'; }}
          >
            <Plus className="w-4 h-4" />
            Add Income
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={formatCurrency(totalBalance, 'USD')}
          icon={Wallet}
          color="#7c3aed"
          subtext={`${accounts?.length ?? 0} account${(accounts?.length ?? 0) !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Income This Month"
          value={formatCurrency(incomeThisMonth, 'USD')}
          icon={TrendingUp}
          color="#22c55e"
          subtext={`${monthTransactions?.filter((t) => t.type === 'income').length ?? 0} transactions`}
        />
        <StatCard
          label="Expenses This Month"
          value={formatCurrency(expensesThisMonth, 'USD')}
          icon={TrendingDown}
          color="#ef4444"
          subtext={`${monthTransactions?.filter((t) => t.type === 'expense').length ?? 0} transactions`}
        />
        <StatCard
          label="Net This Month"
          value={`${net >= 0 ? '+' : ''}${formatCurrency(net, 'USD')}`}
          icon={Activity}
          color={net >= 0 ? '#22c55e' : '#ef4444'}
          subtext={net >= 0 ? 'Positive cashflow' : 'Negative cashflow'}
        />
      </div>

      {/* Daily Chart */}
      <div
        className="rounded-2xl"
        style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #2a2a40' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>
                Daily Activity — {rangeDates.title}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#555570' }}>
                Income, expenses and cumulative net per day
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SHORTCUTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setChartRange(s.key)}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={
                    chartRange === s.key
                      ? { backgroundColor: '#7c3aed', color: '#ffffff' }
                      : { backgroundColor: '#1a1a2e', color: '#8888a0', border: '1px solid #2a2a40' }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-2 py-4">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={dailyChartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#555570', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#555570', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`}
                width={36}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40', borderRadius: 12, color: '#e8e8f0', fontSize: 12 }}
                labelFormatter={(d) => `Day ${d}`}
                formatter={(value, name) => [
                  formatCurrency(Number(value ?? 0), 'USD'),
                  String(name ?? '').charAt(0).toUpperCase() + String(name ?? '').slice(1),
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) => <span style={{ color: '#8888a0' }}>{value.charAt(0).toUpperCase() + value.slice(1)}</span>}
              />
              <Bar dataKey="income" fill="#22c55e" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar dataKey="expense" fill="#ef4444" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Line dataKey="net" type="monotone" stroke="#7c3aed" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div
          className="lg:col-span-2 rounded-2xl"
          style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid #2a2a40' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>
              Recent Transactions
            </h2>
            <a href="/transactions" className="text-xs" style={{ color: '#7c3aed' }}>
              View all
            </a>
          </div>
          <div className="px-2 py-2">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3"
                  style={{ backgroundColor: '#1a1a2e' }}
                >
                  💸
                </div>
                <p className="text-sm font-medium" style={{ color: '#e8e8f0' }}>
                  No transactions yet
                </p>
                <p className="text-xs mt-1" style={{ color: '#555570' }}>
                  Add your first transaction to get started
                </p>
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  category={categoryMap.get(tx.categoryId)}
                  account={accountMap.get(tx.accountId)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  showDate
                />
              ))
            )}
          </div>
        </div>

        {/* Accounts Summary */}
        <div
          className="rounded-2xl"
          style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid #2a2a40' }}
          >
            <h2 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>
              Accounts
            </h2>
            <a href="/accounts" className="text-xs" style={{ color: '#7c3aed' }}>
              Manage
            </a>
          </div>
          <div className="p-3 space-y-2">
            {(accounts?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3"
                  style={{ backgroundColor: '#1a1a2e' }}
                >
                  🏦
                </div>
                <p className="text-sm font-medium" style={{ color: '#e8e8f0' }}>
                  No accounts yet
                </p>
                <a href="/accounts" className="text-xs mt-1" style={{ color: '#7c3aed' }}>
                  Add an account
                </a>
              </div>
            ) : (
              accounts?.map((acc) => {
                const txTotal =
                  allTransactions
                    ?.filter((tx) => tx.accountId === acc.id)
                    .reduce((s, tx) => {
                      if (tx.type === 'income') return s + tx.amount;
                      if (tx.type === 'expense') return s - tx.amount;
                      return s;
                    }, 0) ?? 0;
                const balance = acc.initialBalance + txTotal;
                return (
                  <div
                    key={acc.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: '#1a1a2e' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: acc.color + '20' }}
                    >
                      {acc.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>
                        {acc.name}
                      </p>
                      <p className="text-xs capitalize" style={{ color: '#555570' }}>
                        {acc.type.replace('_', ' ')}
                      </p>
                    </div>
                    <span
                      className="text-sm font-semibold shrink-0"
                      style={{ color: balance >= 0 ? '#e8e8f0' : '#ef4444' }}
                    >
                      {formatCurrency(balance, acc.currency)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Savings Goals */}
      <div
        className="rounded-2xl"
        style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #2a2a40' }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>
              Savings Goals
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#555570' }}>
              Progress toward your targets
            </p>
          </div>
          <a href="/goals" className="text-xs" style={{ color: '#7c3aed' }}>
            Manage
          </a>
        </div>

        {(savingsGoals?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3"
              style={{ backgroundColor: '#1a1a2e' }}
            >
              🎯
            </div>
            <p className="text-sm font-medium" style={{ color: '#e8e8f0' }}>No goals yet</p>
            <a href="/goals" className="text-xs mt-1" style={{ color: '#7c3aed' }}>
              Create your first goal
            </a>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {savingsGoals!.map((goal) => {
              const pct = goal.targetAmount > 0
                ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
                : 0;
              const remaining = goal.targetAmount - goal.currentAmount;
              const daysLeft = goal.deadline
                ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
                : null;
              const barColor =
                pct >= 100 ? '#22c55e' : pct >= 66 ? '#7c3aed' : pct >= 33 ? '#f59e0b' : '#ef4444';

              return (
                <div
                  key={goal.id}
                  className="rounded-xl p-4 flex flex-col gap-3"
                  style={{ backgroundColor: '#1a1a2e', border: '1px solid #2a2a40' }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: goal.color + '20' }}
                    >
                      {goal.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#e8e8f0' }}>
                        {goal.name}
                      </p>
                      <p className="text-xs" style={{ color: '#8888a0' }}>
                        {goal.currency}
                        {daysLeft !== null && (
                          <span style={{ color: daysLeft < 30 ? '#f59e0b' : '#555570' }}>
                            {' '}· {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-lg"
                      style={{ backgroundColor: barColor + '20', color: barColor }}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#2a2a40' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>

                  {/* Amounts */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span style={{ color: '#555570' }}>Saved </span>
                      <span className="font-semibold" style={{ color: '#e8e8f0' }}>
                        {formatCurrency(goal.currentAmount, goal.currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span style={{ color: '#555570' }}>Target </span>
                      <span className="font-semibold" style={{ color: '#e8e8f0' }}>
                        {formatCurrency(goal.targetAmount, goal.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Distance from goal */}
                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
                    style={{ backgroundColor: '#12121a' }}
                  >
                    <span style={{ color: '#8888a0' }}>Still needed</span>
                    <span className="font-semibold" style={{ color: remaining > 0 ? '#f59e0b' : '#22c55e' }}>
                      {remaining > 0
                        ? `− ${formatCurrency(remaining, goal.currency)}`
                        : '✓ Goal reached!'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        editingId={editingId}
      />
    </div>
  );
}
