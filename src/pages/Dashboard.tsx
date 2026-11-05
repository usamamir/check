import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Check } from 'lucide-react';
import { useFinance, budgetProgress } from '../store/FinanceContext';
import { calcAssets, calcLiabilities, calcNetWorth } from '../data/seed';
import { formatCurrency, shortDate } from '../lib/format';

export function Dashboard() {
  const { state, markReviewed, getCategory, getAccount } = useFinance();
  const netWorth = calcNetWorth(state.accounts);
  const assets = calcAssets(state.accounts);
  const liabilities = calcLiabilities(state.accounts);
  const progress = budgetProgress(state.budgets, state.transactions);
  const flexibleLeft = progress.flexible.planned - progress.flexible.actual;
  const unreviewed = state.transactions.filter((t) => !t.reviewed).slice(0, 6);
  const recent = state.transactions.slice(0, 8);
  const history = state.netWorthHistory;

  const nwDelta =
    history.length > 1
      ? history[history.length - 1].netWorth - history[history.length - 2].netWorth
      : 0;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="grid-3">
        <div className="card card-pad">
          <div className="card-meta">Net worth</div>
          <div className="stat-value">{formatCurrency(netWorth)}</div>
          <div className={`stat-delta ${nwDelta >= 0 ? 'up' : 'down'}`}>
            {formatCurrency(nwDelta, { signed: true })} this month
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-meta">Assets</div>
          <div className="stat-value">{formatCurrency(assets)}</div>
          <div className="stat-delta up">{formatCurrency(Math.abs(liabilities))} in liabilities</div>
        </div>
        <div className="card card-pad">
          <div className="card-meta">Flexible spending left</div>
          <div className="stat-value">{formatCurrency(Math.max(flexibleLeft, 0))}</div>
          <div style={{ marginTop: 10 }}>
            <div className="progress green">
              <span
                style={{
                  width: `${Math.min(100, (progress.flexible.actual / Math.max(progress.flexible.planned, 1)) * 100)}%`,
                }}
              />
            </div>
            <div className="card-meta" style={{ marginTop: 6 }}>
              {formatCurrency(progress.flexible.actual)} of {formatCurrency(progress.flexible.planned)}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 className="card-title">Net worth</h3>
            <Link to="/reports" className="btn btn-ghost btn-sm">
              View reports <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff5a36" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ff5a36" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) =>
                    new Date(v + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })
                  }
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#a8a29e', fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                  tick={{ fill: '#a8a29e', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ background: '#1c1917', border: 0, borderRadius: 10, color: '#fff' }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Net worth']}
                  labelFormatter={(l) =>
                    new Date(String(l) + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  }
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="#ff5a36"
                  strokeWidth={2.5}
                  fill="url(#nw)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              padding: '16px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 className="card-title">Needs review</h3>
            <Link to="/transactions" className="btn btn-ghost btn-sm">
              See all
            </Link>
          </div>
          {unreviewed.length === 0 ? (
            <div className="empty">You're all caught up.</div>
          ) : (
            unreviewed.map((t) => (
              <div
                key={t.id}
                className="account-row"
                style={{ justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                  <button
                    className="check"
                    onClick={() => markReviewed([t.id])}
                    title="Mark reviewed"
                    aria-label="Mark reviewed"
                  >
                    <Check size={12} />
                  </button>
                  <div className="account-info">
                    <div className="name">{t.merchant}</div>
                    <div className="meta">
                      {shortDate(t.date)} · {getCategory(t.categoryId)?.name} ·{' '}
                      {getAccount(t.accountId)?.name}
                    </div>
                  </div>
                </div>
                <div className={`amount ${t.amount > 0 ? 'pos' : 'neg'}`}>
                  {formatCurrency(t.amount, { signed: true })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div
            style={{
              padding: '16px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 className="card-title">Recent transactions</h3>
            <Link to="/transactions" className="btn btn-ghost btn-sm">
              View all
            </Link>
          </div>
          <table className="table">
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className={!t.reviewed ? 'unreviewed' : undefined}>
                  <td style={{ width: 70, color: 'var(--text-muted)' }}>{shortDate(t.date)}</td>
                  <td>
                    <div style={{ fontWeight: 650 }}>{t.merchant}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {getCategory(t.categoryId)?.emoji} {getCategory(t.categoryId)?.name}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`amount ${t.amount > 0 ? 'pos' : ''}`}>
                      {formatCurrency(t.amount, { signed: true })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="card-title">Goals</h3>
              <Link to="/goals" className="btn btn-ghost btn-sm">
                Manage
              </Link>
            </div>
            {state.goals.map((g) => {
              const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
              return (
                <div key={g.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 650 }}>
                      {g.emoji} {g.name}
                    </span>
                    <span className="card-meta">{Math.round(pct)}%</span>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 className="card-title">Budget snapshot</h3>
              <Link to="/budget" className="btn btn-ghost btn-sm">
                Open
              </Link>
            </div>
            {(
              [
                ['Fixed', progress.fixed],
                ['Flexible', progress.flexible],
                ['Non-monthly', progress.non_monthly],
              ] as const
            ).map(([label, s]) => {
              const pct = (s.actual / Math.max(s.planned, 1)) * 100;
              return (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{label}</span>
                    <span className="card-meta">
                      {formatCurrency(s.actual)} / {formatCurrency(s.planned)}
                    </span>
                  </div>
                  <div
                    className={`progress ${pct > 100 ? 'over' : pct > 85 ? 'warn' : 'green'}`}
                    style={{ marginTop: 6 }}
                  >
                    <span style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
