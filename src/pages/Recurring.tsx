import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency, shortDate } from '../lib/format';
import { Modal } from '../components/Modal';

export function Recurring() {
  const { state, toggleRecurring, deleteRecurring, addRecurring, getCategory, getAccount } =
    useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as const,
    nextDate: new Date().toISOString().slice(0, 10),
    categoryId: 'c-streaming',
    accountId: state.accounts[0]?.id ?? '',
    type: 'expense' as 'income' | 'expense' | 'credit',
  });

  const summary = useMemo(() => {
    const active = state.recurring.filter((r) => r.active);
    return {
      income: active.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0),
      expenses: active.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0),
      credit: active.filter((r) => r.type === 'credit').reduce((s, r) => s + r.amount, 0),
    };
  }, [state.recurring]);

  const upcoming = [...state.recurring].sort((a, b) => a.nextDate.localeCompare(b.nextDate));

  const submit = () => {
    if (!form.name.trim() || !form.accountId) return;
    addRecurring({
      name: form.name.trim(),
      amount: Number(form.amount) || 0,
      frequency: form.frequency,
      nextDate: form.nextDate,
      categoryId: form.categoryId,
      accountId: form.accountId,
      type: form.type,
      active: true,
    });
    setShowAdd(false);
    setForm({
      name: '',
      amount: '',
      frequency: 'monthly',
      nextDate: new Date().toISOString().slice(0, 10),
      categoryId: 'c-streaming',
      accountId: state.accounts[0]?.id ?? '',
      type: 'expense',
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="toolbar">
        <div className="card-meta" style={{ margin: 0 }}>
          Bills, subscriptions, and recurring income
        </div>
        <div className="filters">
          <button
            className="btn btn-primary"
            onClick={() => setShowAdd(true)}
            disabled={state.accounts.length === 0}
          >
            <Plus size={16} /> Add recurring
          </button>
        </div>
      </div>

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
        {upcoming.length === 0 ? (
          <div className="empty">
            No recurring items yet. Add subscriptions, bills, or paychecks once you have an account.
          </div>
        ) : (
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
                <th />
              </tr>
            </thead>
            <tbody>
              {upcoming.map((r) => (
                <tr key={r.id} style={{ opacity: r.active ? 1 : 0.55 }}>
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
                  <td>
                    <button
                      className="btn-icon"
                      title="Delete"
                      onClick={() => deleteRecurring(r.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd ? (
        <Modal
          title="Add recurring"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submit}>
                Add
              </button>
            </>
          }
        >
          <div className="field">
            <label>Name</label>
            <input
              className="text-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Netflix"
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Amount</label>
              <input
                className="text-input"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Type</label>
              <select
                className="select-input"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as 'income' | 'expense' | 'credit' })
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="credit">Credit payment</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Account</label>
              <select
                className="select-input"
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              >
                {state.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Category</label>
              <select
                className="select-input"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Next date</label>
            <input
              className="text-input"
              type="date"
              value={form.nextDate}
              onChange={(e) => setForm({ ...form, nextDate: e.target.value })}
            />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
