import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency } from '../lib/format';
import { Modal } from '../components/Modal';
import type { AccountGroup, AccountType } from '../types';

const groupLabels: Record<AccountGroup, string> = {
  cash: 'Cash',
  credit: 'Credit cards',
  investments: 'Investments',
  property: 'Property',
  loans: 'Loans',
};

const groupOrder: AccountGroup[] = ['cash', 'credit', 'investments', 'property', 'loans'];

export function Accounts() {
  const { state, addAccount, updateAccount, deleteAccount } = useFinance();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<'amount' | 'percent'>('amount');
  const [showAdd, setShowAdd] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    institution: '',
    type: 'checking' as AccountType,
    group: 'cash' as AccountGroup,
    balance: '',
    mask: '0000',
    color: '#117ACA',
  });

  const totals = useMemo(() => {
    const byGroup: Record<AccountGroup, number> = {
      cash: 0,
      credit: 0,
      investments: 0,
      property: 0,
      loans: 0,
    };
    for (const a of state.accounts) byGroup[a.group] += a.balance;
    const grand = Object.values(byGroup).reduce((s, v) => s + Math.abs(v), 0) || 1;
    return { byGroup, grand };
  }, [state.accounts]);

  const submit = () => {
    if (!form.name.trim()) return;
    addAccount({
      name: form.name.trim(),
      institution: form.institution.trim() || 'Manual',
      type: form.type,
      group: form.group,
      balance: Number(form.balance) || 0,
      mask: form.mask || '0000',
      color: form.color,
      includeInNetWorth: true,
    });
    setShowAdd(false);
    setForm({
      name: '',
      institution: '',
      type: 'checking',
      group: 'cash',
      balance: '',
      mask: '0000',
      color: '#117ACA',
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="toolbar">
        <div className="segmented">
          <button className={mode === 'amount' ? 'active' : ''} onClick={() => setMode('amount')}>
            Total amounts
          </button>
          <button className={mode === 'percent' ? 'active' : ''} onClick={() => setMode('percent')}>
            Percents
          </button>
        </div>
        <div className="filters">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add account
          </button>
        </div>
      </div>

      {state.accounts.length === 0 ? (
        <div className="card card-pad empty" style={{ padding: 48 }}>
          <h3 className="card-title" style={{ marginBottom: 8 }}>
            No accounts yet
          </h3>
          <p className="card-meta" style={{ marginBottom: 16, maxWidth: 420, marginInline: 'auto' }}>
            Add checking, savings, credit cards, investments, or loans to build your net worth and
            track spending with your own numbers.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add your first account
          </button>
        </div>
      ) : null}

      {groupOrder.map((group) => {
        const accounts = state.accounts.filter((a) => a.group === group);
        if (!accounts.length) return null;
        const total = totals.byGroup[group];
        const isCollapsed = collapsed[group];
        return (
          <div className="card" key={group}>
            <div
              className="group-header"
              onClick={() => setCollapsed((c) => ({ ...c, [group]: !c[group] }))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                {groupLabels[group]}
                <span className="pill">{accounts.length}</span>
              </div>
              <div className="amount">
                {mode === 'amount'
                  ? formatCurrency(total)
                  : `${((Math.abs(total) / totals.grand) * 100).toFixed(1)}%`}
              </div>
            </div>
            {!isCollapsed &&
              accounts.map((a) => (
                <div className="account-row" key={a.id}>
                  <div className="account-icon" style={{ background: a.color }}>
                    {a.institution.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="account-info">
                    <div className="name">{a.name}</div>
                    <div className="meta">
                      {a.institution} ···{a.mask} · synced {a.lastSynced}
                    </div>
                  </div>
                  <label
                    className="pill"
                    style={{ cursor: 'pointer' }}
                    title="Include in net worth"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={a.includeInNetWorth}
                      onChange={(e) =>
                        updateAccount(a.id, { includeInNetWorth: e.target.checked })
                      }
                      style={{ marginRight: 4 }}
                    />
                    NW
                  </label>
                  <div className="amount" style={{ minWidth: 110, textAlign: 'right' }}>
                    {formatCurrency(a.balance)}
                  </div>
                  <button
                    className="btn-icon"
                    title="Delete account"
                    aria-label={`Delete ${a.name}`}
                    onClick={() => setPendingDelete(a.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
          </div>
        );
      })}

      {pendingDelete ? (
        <Modal
          title="Delete account?"
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  deleteAccount(pendingDelete);
                  setPendingDelete(null);
                }}
              >
                Delete account
              </button>
            </>
          }
        >
          <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            This removes{' '}
            <strong>{state.accounts.find((a) => a.id === pendingDelete)?.name}</strong> and all of
            its transactions and recurring items.
          </p>
        </Modal>
      ) : null}

      {showAdd ? (
        <Modal
          title="Add account"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submit}>
                Add account
              </button>
            </>
          }
        >
          <div className="field">
            <label>Account name</label>
            <input
              className="text-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Emergency savings"
            />
          </div>
          <div className="field">
            <label>Institution</label>
            <input
              className="text-input"
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              placeholder="Ally, Chase, Manual..."
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Type</label>
              <select
                className="select-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit card</option>
                <option value="investment">Investment</option>
                <option value="loan">Loan</option>
                <option value="mortgage">Mortgage</option>
                <option value="real_estate">Real estate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field">
              <label>Group</label>
              <select
                className="select-input"
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value as AccountGroup })}
              >
                {groupOrder.map((g) => (
                  <option key={g} value={g}>
                    {groupLabels[g]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Balance</label>
            <input
              className="text-input"
              type="number"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
