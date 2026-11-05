import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency } from '../lib/format';

export function CashFlow() {
  const { state } = useFinance();

  const data = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expenses: number }>();
    for (const t of state.transactions) {
      if (t.pending) continue;
      const key = t.date.slice(0, 7);
      if (!map.has(key)) map.set(key, { month: key, income: 0, expenses: 0 });
      const row = map.get(key)!;
      if (t.amount > 0) row.income += t.amount;
      else row.expenses += Math.abs(t.amount);
    }
    return [...map.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((r) => ({
        ...r,
        label: new Date(r.month + '-01T12:00:00').toLocaleDateString('en-US', { month: 'short' }),
        net: r.income - r.expenses,
      }));
  }, [state.transactions]);

  const current = data[data.length - 1];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="grid-3">
        <div className="card card-pad">
          <div className="card-meta">Income this month</div>
          <div className="stat-value" style={{ color: 'var(--positive)' }}>
            {formatCurrency(current?.income ?? 0)}
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-meta">Expenses this month</div>
          <div className="stat-value">{formatCurrency(current?.expenses ?? 0)}</div>
        </div>
        <div className="card card-pad">
          <div className="card-meta">Net cash flow</div>
          <div
            className="stat-value"
            style={{ color: (current?.net ?? 0) >= 0 ? 'var(--positive)' : 'var(--negative)' }}
          >
            {formatCurrency(current?.net ?? 0, { signed: true })}
          </div>
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="card-title" style={{ marginBottom: 12 }}>
          Monthly cash flow
        </h3>
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#a8a29e' }} />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a8a29e', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ background: '#1c1917', border: 0, borderRadius: 10, color: '#fff' }}
                formatter={(value) => formatCurrency(Number(value ?? 0))}
              />
              <Legend />
              <Bar dataKey="income" name="Income" fill="#0f7b4c" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ff5a36" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th style={{ textAlign: 'right' }}>Income</th>
              <th style={{ textAlign: 'right' }}>Expenses</th>
              <th style={{ textAlign: 'right' }}>Net</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((r) => (
              <tr key={r.month}>
                <td style={{ fontWeight: 650 }}>
                  {new Date(r.month + '-01T12:00:00').toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </td>
                <td style={{ textAlign: 'right' }} className="amount pos">
                  {formatCurrency(r.income)}
                </td>
                <td style={{ textAlign: 'right' }} className="amount">
                  {formatCurrency(r.expenses)}
                </td>
                <td
                  style={{ textAlign: 'right' }}
                  className={`amount ${r.net >= 0 ? 'pos' : ''}`}
                >
                  {formatCurrency(r.net, { signed: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
