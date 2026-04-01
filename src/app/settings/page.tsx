'use client';

import { useState } from 'react';
import { useObservable } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { FlaskConical, Trash2, Download, Upload, Palette, Cloud, LogIn, LogOut } from 'lucide-react';
import { db } from '@/lib/db';
import { seedDemoData } from '@/lib/utils/demoSeed';
import { useThemeStore } from '@/lib/stores/themeStore';
import { themeMetas } from '@/lib/themes';

export default function SettingsPage() {
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);
  const c = useThemeStore((s) => s.colors);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  const currentUser = useObservable(db.cloud.currentUser);
  const isLoggedIn = currentUser?.isLoggedIn ?? false;

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
        <h1 className="text-2xl font-bold" style={{ color: c.textPrimary }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: c.textSecondary }}>Manage your data and preferences</p>
      </div>

      {/* Theme Selector */}
      <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: c.bgSecondary, border: `1px solid ${c.borderDefault}` }}>
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${c.borderDefault}` }}>
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" style={{ color: c.accent }} />
            <h2 className="text-sm font-semibold" style={{ color: c.textPrimary }}>Theme</h2>
          </div>
          <p className="text-xs mt-0.5" style={{ color: c.textTertiary }}>Choose the look and feel of the app</p>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {themeMetas.map((theme) => {
              const isActive = themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className="flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all"
                  style={{
                    backgroundColor: isActive ? c.accent + '15' : c.bgTertiary,
                    border: isActive ? `2px solid ${c.accent}` : `2px solid transparent`,
                  }}
                >
                  <div
                    className="w-full h-10 rounded-lg"
                    style={{ background: theme.preview }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: isActive ? c.accent : c.textSecondary }}
                  >
                    {theme.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cloud Sync */}
      <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: c.bgSecondary, border: `1px solid ${c.borderDefault}` }}>
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${c.borderDefault}` }}>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4" style={{ color: c.accent }} />
            <h2 className="text-sm font-semibold" style={{ color: c.textPrimary }}>Cloud Sync</h2>
          </div>
          <p className="text-xs mt-0.5" style={{ color: c.textTertiary }}>
            Sync your data across devices. Login to enable.
          </p>
        </div>
        <div className="px-6 py-5">
          {isLoggedIn ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: '#22c55e20' }}>
                  ✅
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: c.textPrimary }}>Syncing</p>
                  <p className="text-xs" style={{ color: c.textSecondary }}>{currentUser?.email}</p>
                </div>
              </div>
              <button
                onClick={() => db.cloud.logout()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="rounded-xl p-4 text-sm"
                style={{ backgroundColor: c.accent + '15', border: `1px solid ${c.accent}30`, color: c.accent }}
              >
                Login to sync data between your iPhone, PC, and any other device automatically.
              </div>
              <button
                onClick={() => db.cloud.login()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ backgroundColor: c.accent, color: '#fff' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = c.accentHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = c.accent; }}
              >
                <LogIn className="w-4 h-4" />
                Login with Email
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Demo Data */}
      <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: c.bgSecondary, border: `1px solid ${c.borderDefault}` }}>
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${c.borderDefault}` }}>
          <h2 className="text-sm font-semibold" style={{ color: c.textPrimary }}>Demo Data</h2>
          <p className="text-xs mt-0.5" style={{ color: c.textTertiary }}>Load a full year of realistic sample data to explore all features</p>
        </div>
        <div className="px-6 py-5">
          <div
            className="rounded-xl p-4 mb-4 text-sm"
            style={{ backgroundColor: c.accent + '15', border: `1px solid ${c.accent}30`, color: c.accent }}
          >
            Loads: <strong>4 accounts</strong> · <strong>~300 transactions</strong> · <strong>8 monthly budgets</strong> · <strong>4 savings goals</strong> · 12 months of income &amp; expenses
          </div>
          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: c.accent, color: '#fff' }}
            onMouseEnter={(e) => { if (!loadingDemo) (e.currentTarget as HTMLElement).style.backgroundColor = c.accentHover; }}
            onMouseLeave={(e) => { if (!loadingDemo) (e.currentTarget as HTMLElement).style.backgroundColor = c.accent; }}
          >
            <FlaskConical className="w-4 h-4" />
            {loadingDemo ? 'Loading demo data…' : 'Load 1 Year of Demo Data'}
          </button>
        </div>
      </section>

      {/* Data Export / Import */}
      <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: c.bgSecondary, border: `1px solid ${c.borderDefault}` }}>
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${c.borderDefault}` }}>
          <h2 className="text-sm font-semibold" style={{ color: c.textPrimary }}>Backup &amp; Restore</h2>
          <p className="text-xs mt-0.5" style={{ color: c.textTertiary }}>Export all your data as JSON or restore from a previous backup</p>
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
      <section className="rounded-2xl overflow-hidden" style={{ backgroundColor: c.bgSecondary, border: '1px solid #ef444440' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #ef444430' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#ef4444' }}>Danger Zone</h2>
          <p className="text-xs mt-0.5" style={{ color: c.textTertiary }}>Irreversible actions — proceed with caution</p>
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
