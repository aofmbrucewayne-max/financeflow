'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Building2,
  Tag,
  PieChart,
  Target,
  Settings,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/lib/stores/themeStore';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Accounts', href: '/accounts', icon: Building2 },
  { label: 'Categories', href: '/categories', icon: Tag },
  { label: 'Budgets', href: '/budgets', icon: PieChart },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Settings', href: '/settings', icon: Settings },
];

const mobileNavItems = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Accounts', href: '/accounts', icon: Building2 },
  { label: 'Categories', href: '/categories', icon: Tag },
  { label: 'Budgets', href: '/budgets', icon: PieChart },
  { label: 'Goals', href: '/goals', icon: Target },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const c = useThemeStore((s) => s.colors);

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-40"
        style={{ backgroundColor: c.bgSecondary, borderRight: `1px solid ${c.borderDefault}` }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-5 py-5"
          style={{ borderBottom: `1px solid ${c.borderDefault}` }}
        >
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: c.accent }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-base tracking-tight" style={{ color: c.textPrimary }}>
            FinanceFlow
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                )}
                style={isActive ? { backgroundColor: c.accent, color: '#ffffff' } : { color: c.textSecondary }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = c.bgTertiary;
                    (e.currentTarget as HTMLElement).style.color = c.textPrimary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = c.textSecondary;
                  }
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4" style={{ borderTop: `1px solid ${c.borderDefault}` }}>
          <p className="text-xs" style={{ color: c.textTertiary }}>v1.0.0</p>
        </div>
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────────── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ backgroundColor: c.bgSecondary, borderBottom: `1px solid ${c.borderDefault}` }}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ backgroundColor: c.accent }}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm" style={{ color: c.textPrimary }}>FinanceFlow</span>
        </div>
      </header>

      {/* ── Mobile Floating Bottom Nav ──────── */}
      <nav
        className="md:hidden fixed z-40"
        style={{
          bottom: 'calc(18px + env(safe-area-inset-bottom))',
          left: '20px',
          right: '20px',
        }}
      >
        <div
          className="flex items-center overflow-x-auto scrollbar-none px-3 h-[66px] gap-1"
          style={{
            backgroundColor: c.navBg,
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '24px',
            border: `1px solid ${c.navBorder}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255,255,255,0.05) inset',
            scrollbarWidth: 'none',
          }}
        >
          {mobileNavItems.map(({ label, href, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-1 shrink-0 px-3.5 py-2 rounded-2xl transition-all min-w-[58px]"
                style={
                  isActive
                    ? { color: '#ffffff', backgroundColor: c.accent + '30' }
                    : { color: c.textTertiary }
                }
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] font-medium whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
