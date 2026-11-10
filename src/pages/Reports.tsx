import { useMemo, useState } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency, shortDate } from '../lib/format';

const COLORS = ['#ff5a36', '#0f7b4c', '#2563eb', '#c27803', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];

export function Reports() {
  const { state, getCategory, getAccount } = useFinance();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const month = new Date().toISOString().slice(0, 7);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of state.transactions) {
      if (!t.date.startsWith(month) || t.amount >= 0 || t.pending) continue;
      const cat = getCategory(t.categoryId);
      if (!cat || cat.type !== 'expense') continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + Math.abs(t.amount));
    }
    return [...map.entries()]
      .map(([id, value]) => ({
        id,
        name: getCategory(id)?.name ?? 'Other',
        emoji: getCategory(id)?.emoji ?? '',
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [state.transactions, month, getCategory]);

  const filteredTx = useMemo(() => {
    return state.transactions.filter((t) => {
      if (!t.date.startsWith(month) || t.amount >= 0) return false;
      if (selectedCategory && t.categoryId !== selectedCategory) return false;
      return true;
    });
  }, [state.transactions, month, selectedCategory]);

  const total = byCategory.reduce((s, c) => s + c.value, 0);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="dashboard-grid">
        <div className="card card-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 className="card-title">Spending by category</h3>
            <span className="pill accent">{formatCurrency(total)} this month</span>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  onClick={(_, index) => {
                    const item = byCategory[index];
                    setSelectedCategory((cur) => (cur === item.id ? null : item.id));
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {byCategory.map((entry, i) => (
                    <Cell
                      key={entry.id}
                      fill={COLORS[i % COLORS.length]}
                      opacity={
                        !selectedCategory || selectedCategory === entry.id ? 1 : 0.35
                      }
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1c1917', border: 0, borderRadius: 10, color: '#fff' }}
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {selectedCategory ? (
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCategory(null)}>
              Clear filter: {getCategory(selectedCategory)?.name}
            </button>
          ) : (
            <div className="card-meta">Click a slice to filter transactions below</div>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="card-title" style={{ marginBottom: 12 }}>
            Top categories
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byCategory.slice(0, 8)}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e5e4" />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#57534e', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ background: '#1c1917', border: 0, borderRadius: 10, color: '#fff' }}
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  onClick={(data) => {
                    const id = (data as { id?: string }).id;
                    if (id) setSelectedCategory((cur) => (cur === id ? null : id));
                  }}
                >
                  {byCategory.slice(0, 8).map((entry, i) => (
                    <Cell key={entry.id} fill={COLORS[i % COLORS.length]} cursor="pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <h3 className="card-title">
            Transactions {selectedCategory ? `· ${getCategory(selectedCategory)?.name}` : ''}
          </h3>
          <span className="card-meta">{filteredTx.length} items</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Account</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.slice(0, 40).map((t) => (
              <tr key={t.id}>
                <td>{shortDate(t.date)}</td>
                <td style={{ fontWeight: 650 }}>{t.merchant}</td>
                <td>
                  {getCategory(t.categoryId)?.emoji} {getCategory(t.categoryId)?.name}
                </td>
                <td>{getAccount(t.accountId)?.name}</td>
                <td style={{ textAlign: 'right' }} className="amount">
                  {formatCurrency(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
