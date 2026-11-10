import { useMemo } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency, formatPercent } from '../lib/format';

const COLORS = ['#0f7b4c', '#2563eb', '#ff5a36', '#c27803', '#7c3aed', '#0891b2'];

export function Investments() {
  const { state } = useFinance();
  const accounts = state.accounts.filter((a) => a.group === 'investments');
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  const holdings = useMemo(
    () =>
      accounts.flatMap((a) =>
        (a.holdings ?? []).map((h) => ({
          ...h,
          account: a.name,
          value: h.shares * h.price,
          gain: h.shares * h.price - h.costBasis,
        })),
      ),
    [accounts],
  );

  const allocation = holdings
    .map((h) => ({ name: h.symbol, value: h.value }))
    .sort((a, b) => b.value - a.value);

  const dayChange = holdings.reduce((s, h) => s + h.value * (h.changePct / 100), 0);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="grid-3">
        <div className="card card-pad">
          <div className="card-meta">Portfolio value</div>
          <div className="stat-value">{formatCurrency(total)}</div>
        </div>
        <div className="card card-pad">
          <div className="card-meta">Today's change</div>
          <div className={`stat-value ${dayChange >= 0 ? '' : ''}`} style={{ color: dayChange >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
            {formatCurrency(dayChange, { signed: true })}
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-meta">Holdings</div>
          <div className="stat-value">{holdings.length}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card card-pad">
          <h3 className="card-title" style={{ marginBottom: 8 }}>
            Allocation
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocation} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {allocation.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1c1917', border: 0, borderRadius: 10, color: '#fff' }}
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
            <h3 className="card-title">Accounts</h3>
          </div>
          {accounts.map((a) => (
            <div className="account-row" key={a.id}>
              <div className="account-icon" style={{ background: a.color }}>
                {a.institution.slice(0, 2).toUpperCase()}
              </div>
              <div className="account-info">
                <div className="name">{a.name}</div>
                <div className="meta">{a.institution}</div>
              </div>
              <div className="amount">{formatCurrency(a.balance)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Account</th>
              <th style={{ textAlign: 'right' }}>Shares</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Value</th>
              <th style={{ textAlign: 'right' }}>Gain</th>
              <th style={{ textAlign: 'right' }}>Day</th>
            </tr>
          </thead>
          <tbody>
            {holdings
              .sort((a, b) => b.value - a.value)
              .map((h) => (
                <tr key={`${h.account}-${h.symbol}`}>
                  <td style={{ fontWeight: 750 }}>{h.symbol}</td>
                  <td>{h.name}</td>
                  <td>{h.account}</td>
                  <td style={{ textAlign: 'right' }}>{h.shares.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(h.price)}</td>
                  <td style={{ textAlign: 'right' }} className="amount">
                    {formatCurrency(h.value)}
                  </td>
                  <td
                    style={{ textAlign: 'right' }}
                    className={`amount ${h.gain >= 0 ? 'pos' : ''}`}
                  >
                    {formatCurrency(h.gain, { signed: true })}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      color: h.changePct >= 0 ? 'var(--positive)' : 'var(--negative)',
                      fontWeight: 650,
                    }}
                  >
                    {formatPercent(h.changePct, 1)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
