import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from './Modal';
import { useFinance } from '../store/FinanceContext';

export function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const { state, addTransaction } = useFinance();
  const hasAccounts = state.accounts.length > 0;
  const [form, setForm] = useState({
    merchant: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    accountId: state.accounts.find((a) => a.type === 'checking')?.id ?? state.accounts[0]?.id ?? '',
    categoryId: 'c-uncategorized',
    notes: '',
  });

  const submit = () => {
    const amount = Number(form.amount);
    if (!form.merchant.trim() || !Number.isFinite(amount) || !form.accountId) return;
    addTransaction({
      merchant: form.merchant.trim(),
      amount,
      date: form.date,
      accountId: form.accountId,
      categoryId: form.categoryId,
      notes: form.notes,
      reviewed: false,
      pending: false,
      tags: [],
    });
    onClose();
  };

  if (!hasAccounts) {
    return (
      <Modal
        title="Add an account first"
        onClose={onClose}
        footer={
          <>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <Link to="/accounts" className="btn btn-primary" onClick={onClose}>
              Go to Accounts
            </Link>
          </>
        }
      >
        <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
          Transactions need an account. Add a checking, savings, or credit account, then come back
          to log spending.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Add transaction"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            Add transaction
          </button>
        </>
      }
    >
      <div className="field">
        <label>Merchant</label>
        <input
          className="text-input"
          value={form.merchant}
          onChange={(e) => setForm({ ...form, merchant: e.target.value })}
          placeholder="Whole Foods"
          autoFocus
        />
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Amount (negative = expense)</label>
          <input
            className="text-input"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="-42.50"
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input
            className="text-input"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
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
        <label>Notes</label>
        <input
          className="text-input"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional"
        />
      </div>
    </Modal>
  );
}
