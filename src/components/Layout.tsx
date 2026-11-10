import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useFinance } from '../store/FinanceContext';

const titles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Your home base for money clarity' },
  '/accounts': { title: 'Accounts', subtitle: 'All your accounts in one place' },
  '/transactions': { title: 'Transactions', subtitle: 'Review and categorize spending' },
  '/cash-flow': { title: 'Cash Flow', subtitle: 'Income vs expenses over time' },
  '/reports': { title: 'Reports', subtitle: 'Spending insights and trends' },
  '/budget': { title: 'Budget', subtitle: 'Plan the month with flex budgeting' },
  '/recurring': { title: 'Recurring', subtitle: 'Bills, subscriptions, and income' },
  '/goals': { title: 'Goals', subtitle: 'Save up and pay down with intention' },
  '/investments': { title: 'Investments', subtitle: 'Portfolio balances and movers' },
  '/settings': { title: 'Settings', subtitle: 'Preferences and household' },
};

export function Layout({ onAddTransaction }: { onAddTransaction: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { state } = useFinance();
  const meta = titles[location.pathname] ?? { title: 'Monarch' };
  const unreviewed = state.transactions.filter((t) => !t.reviewed).length;

  return (
    <div className="app-shell">
      {mobileOpen ? <div className="backdrop" onClick={() => setMobileOpen(false)} /> : null}
      <Sidebar
        collapsed={collapsed}
        open={mobileOpen}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onNavigate={() => setMobileOpen(false)}
      />
      <div className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn-icon mobile-nav-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="page-title">{meta.title}</h1>
              {meta.subtitle ? <p className="page-subtitle">{meta.subtitle}</p> : null}
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn-icon" title="Notifications" aria-label="Notifications">
              <Bell size={16} />
            </button>
            {unreviewed > 0 ? (
              <span className="pill accent">{unreviewed} to review</span>
            ) : (
              <span className="pill green">All caught up</span>
            )}
            <button className="btn btn-primary" onClick={onAddTransaction}>
              <Plus size={16} /> Add
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
