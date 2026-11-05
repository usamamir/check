import { useMemo } from 'react';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency, shortDate } from '../lib/format';

export function Recurring() {
  const { state, toggleRecurring, getCategory, getAccount } = useFinance();

  const summary = useMemo(() => {
    const active = state.recurring.filter((r) => r.active);
    return {
      income: active.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),
      expenses: active.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
      credit: active.filter((r) => r.type === 'credit').reduce((s, r) => s + r.amount, 0),
    };
  }, [state.recurring]);

  const upcoming = [...state.recurring]
    .filter((r) => r.active)
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="grid-3">
        <div className="card card-pad">
          <div className="card-meta">Recurring income</div>
          <div className="stat-value" style={{ color: 'var(--positive)' }}>
            {formatCurrency(summary.income)}
          </div>
        </div>
        <div className="card card-pad">
          <div className="card-meta">Recurring expenses</div>
          <div className="stat-value">{formatCurrency(summary.expenses)}</div>
        </div>
        <div className="card card-pad">
          <div className="card-meta">Credit card payments</div>
          <div className="stat-value">{formatCurrency(summary.credit)}</div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Account</th>
              <th>Next</th>
              <th>Frequency</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((r) => (
              <tr key={r.id} style={{ opacity: r.active ? 1 : 0.5 }}>
                <td style={{ fontWeight: 650 }}>
                  {r.name}
                  <div>
                    <span
                      className={`pill ${r.type === 'income' ? 'green' : r.type === 'credit' ? 'blue' : ''}`}
                    >
                      {r.type}
                    </span>
                  </div>
                </td>
                <td>
                  {getCategory(r.categoryId)?.emoji} {getCategory(r.categoryId)?.name}
                </td>
                <td>{getAccount(r.accountId)?.name}</td>
                <td>{shortDate(r.nextDate)}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.frequency}</td>
                <td
                  style={{ textAlign: 'right' }}
                  className={`amount ${r.type === 'income' ? 'pos' : ''}`}
                >
                  {formatCurrency(r.type === 'income' ? r.amount : -r.amount, { signed: true })}
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${r.active ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => toggleRecurring(r.id)}
                  >
                    {r.active ? 'On' : 'Off'}
                  </button>
                </td>
              </tr>
            ))}
            {state.recurring
              .filter((r) => !r.active)
              .map((r) => (
                <tr key={r.id} style={{ opacity: 0.55 }}>
                  <td style={{ fontWeight: 650 }}>{r.name}</td>
                  <td>{getCategory(r.categoryId)?.name}</td>
                  <td>{getAccount(r.accountId)?.name}</td>
                  <td>{shortDate(r.nextDate)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{r.frequency}</td>
                  <td style={{ textAlign: 'right' }} className="amount">
                    {formatCurrency(r.amount)}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => toggleRecurring(r.id)}>
                      Off
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
