'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { FlaskConical, Trash2, Download, Upload } from 'lucide-react';
import { db } from '@/lib/db';
import { seedDemoData } from '@/lib/utils/demoSeed';

export default function SettingsPage() {
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);

  const handleLoadDemo = async () => {
    if (!confirm('This will replace all your accounts, transactions, budgets and goals with demo data. Continue?')) return;
    setLoadingDemo(true);
    try {
      await seedDemoData();
      toast.success('Demo data loaded — 1 year of transactions, 4 accounts, goals & budgets!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load demo data');
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL data permanently? This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure?')) return;
    setLoadingClear(true);
    try {
      await db.transactions.clear();
      await db.accounts.clear();
      await db.budgets.clear();
      await db.savingsGoals.clear();
      await db.tags.clear();
      toast.success('All data cleared');
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear data');
    } finally {
      setLoadingClear(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const [accounts, transactions, categories, budgets, goals] = await Promise.all([
        db.accounts.toArray(),
        db.transactions.toArray(),
        db.categories.toArray(),
        db.budgets.toArray(),
        db.savingsGoals.toArray(),
      ]);
      const blob = new Blob([JSON.stringify({ accounts, transactions, categories, budgets, goals }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.accounts) await db.accounts.bulkPut(data.accounts);
        if (data.transactions) await db.transactions.bulkPut(data.transactions);
        if (data.categories) await db.categories.bulkPut(data.categories);
        if (data.budgets) await db.budgets.bulkPut(data.budgets);
        if (data.goals) await db.savingsGoals.bulkPut(data.goals);
        toast.success('Backup imported successfully');
      } catch {
        toast.error('Invalid backup file');
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#e8e8f0' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: '#8888a0' }}>Manage your data and preferences</p>
      </div>

      {/* Demo Data */}
      <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #2a2a40' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>Demo Data</h2>
          <p className="text-xs mt-0.5" style={{ color: '#555570' }}>Load a full year of realistic sample data to explore all features</p>
        </div>
        <div className="px-6 py-5">
          <div
            className="rounded-xl p-4 mb-4 text-sm"
            style={{ backgroundColor: '#7c3aed15', border: '1px solid #7c3aed30', color: '#a78bfa' }}
          >
            Loads: <strong>4 accounts</strong> · <strong>~300 transactions</strong> · <strong>8 monthly budgets</strong> · <strong>4 savings goals</strong> · 12 months of income &amp; expenses
          </div>
          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#7c3aed', color: '#fff' }}
            onMouseEnter={(e) => { if (!loadingDemo) (e.currentTarget as HTMLElement).style.backgroundColor = '#6d28d9'; }}
            onMouseLeave={(e) => { if (!loadingDemo) (e.currentTarget as HTMLElement).style.backgroundColor = '#7c3aed'; }}
          >
            <FlaskConical className="w-4 h-4" />
            {loadingDemo ? 'Loading demo data…' : 'Load 1 Year of Demo Data'}
          </button>
        </div>
      </section>

      {/* Data Export / Import */}
      <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#12121a', border: '1px solid #2a2a40' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #2a2a40' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#e8e8f0' }}>Backup &amp; Restore</h2>
          <p className="text-xs mt-0.5" style={{ color: '#555570' }}>Export all your data as JSON or restore from a previous backup</p>
        </div>
        <div className="px-6 py-5 flex gap-3 flex-wrap">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e40' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22c55e30'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#22c55e20'; }}
          >
            <Download className="w-4 h-4" />
            Export JSON Backup
          </button>
          <button
            onClick={handleImportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: '#3b82f620', color: '#3b82f6', border: '1px solid #3b82f640' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#3b82f630'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#3b82f620'; }}
          >
            <Upload className="w-4 h-4" />
            Import JSON Backup
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#12121a', border: '1px solid #ef444440' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #ef444430' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#ef4444' }}>Danger Zone</h2>
          <p className="text-xs mt-0.5" style={{ color: '#555570' }}>Irreversible actions — proceed with caution</p>
        </div>
        <div className="px-6 py-5">
          <button
            onClick={handleClearAll}
            disabled={loadingClear}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}
            onMouseEnter={(e) => { if (!loadingClear) (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444430'; }}
            onMouseLeave={(e) => { if (!loadingClear) (e.currentTarget as HTMLElement).style.backgroundColor = '#ef444420'; }}
          >
            <Trash2 className="w-4 h-4" />
            {loadingClear ? 'Clearing…' : 'Clear All Data'}
          </button>
        </div>
      </section>
    </div>
  );
}
