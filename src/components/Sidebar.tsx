import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Waves,
  PieChart,
  PiggyBank,
  RefreshCw,
  Target,
  LineChart,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { LogoMark } from './Logo';
import { useFinance } from '../store/FinanceContext';
import clsx from 'clsx';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/accounts', label: 'Accounts', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/cash-flow', label: 'Cash Flow', icon: Waves },
  { to: '/reports', label: 'Reports', icon: PieChart },
  { to: '/budget', label: 'Budget', icon: PiggyBank },
  { to: '/recurring', label: 'Recurring', icon: RefreshCw },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/investments', label: 'Investments', icon: LineChart },
];

export function Sidebar({
  collapsed,
  open,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  open: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
}) {
  const { state } = useFinance();
  const unreviewed = state.transactions.filter((t) => !t.reviewed).length;

  return (
    <aside className={clsx('sidebar', collapsed && 'collapsed', open && 'open')}>
      <div className="sidebar-brand">
        <div className="logo" style={{ color: '#fff' }}>
          <LogoMark />
        </div>
        <div className="brand-text">Monarch</div>
      </div>

      <nav className="nav-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="nav-section-label">Track</div>
        {nav.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
            onClick={onNavigate}
            title={item.label}
          >
            <item.icon className="icon" />
            <span className="nav-label">{item.label}</span>
            {item.to === '/transactions' && unreviewed > 0 ? (
              <span className="badge">{unreviewed > 99 ? '99+' : unreviewed}</span>
            ) : null}
          </NavLink>
        ))}
        <div className="nav-section-label" style={{ marginTop: 10 }}>
          Plan
        </div>
        {nav.slice(5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => clsx('nav-item', isActive && 'active')}
            onClick={onNavigate}
            title={item.label}
          >
            <item.icon className="icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/settings"
          className={({ isActive }) => clsx('nav-item', isActive && 'active')}
          onClick={onNavigate}
          title="Settings"
        >
          <Settings className="icon" />
          <span className="nav-label">Settings</span>
        </NavLink>
        <button
          className="nav-item"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeft className="icon" /> : <PanelLeftClose className="icon" />}
          <span className="nav-label">Collapse</span>
        </button>
        <div className="user-chip">
          <div className="avatar">{state.user.initials}</div>
          <div className="user-meta">
            <div className="name">{state.user.name}</div>
            <div className="email">{state.user.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
