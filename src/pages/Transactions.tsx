import { useMemo, useState } from 'react';
import { Check, Search, Trash2 } from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency, shortDate } from '../lib/format';
import clsx from 'clsx';

export function Transactions() {
  const {
    state,
    updateTransaction,
    markReviewed,
    deleteTransaction,
    getCategory,
    getAccount,
  } = useFinance();
  const [query, setQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'unreviewed' | 'reviewed'>('all');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.transactions.filter((t) => {
      if (accountFilter !== 'all' && t.accountId !== accountFilter) return false;
      if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false;
      if (reviewFilter === 'unreviewed' && t.reviewed) return false;
      if (reviewFilter === 'reviewed' && !t.reviewed) return false;
      if (!q) return true;
      const cat = getCategory(t.categoryId)?.name ?? '';
      return (
        t.merchant.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q)
      );
    });
  }, [state.transactions, query, accountFilter, categoryFilter, reviewFilter, getCategory]);

  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const selectAllVisible = () => {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((t) => t.id));
  };

  return (
    <div>
      <div className="toolbar">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 360 }}>
          <Search />
          <input
            className="search-input"
            placeholder="Search merchants, categories, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="filters">
          <select
            className="select-input"
            style={{ width: 'auto' }}
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <option value="all">All accounts</option>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            className="select-input"
            style={{ width: 'auto' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <div className="segmented">
            {(['all', 'unreviewed', 'reviewed'] as const).map((f) => (
              <button
                key={f}
                className={reviewFilter === f ? 'active' : ''}
                onClick={() => setReviewFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'unreviewed' ? 'Needs review' : 'Reviewed'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selected.length > 0 ? (
        <div
          className="card card-pad"
          style={{
            marginBottom: 12,
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            background: 'var(--accent-soft)',
            borderColor: '#ffc9ba',
          }}
        >
          <strong>{selected.length} selected</strong>
          <button className="btn btn-secondary btn-sm" onClick={() => markReviewed(selected, true)}>
            Mark reviewed
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => markReviewed(selected, false)}>
            Mark unreviewed
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>
            Clear
          </button>
        </div>
      ) : null}

      <div className="card" style={{ overflow: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <button
                  className={clsx('check', selected.length === filtered.length && filtered.length > 0 && 'on')}
                  onClick={selectAllVisible}
                  aria-label="Select all"
                >
                  {selected.length === filtered.length && filtered.length > 0 ? (
                    <Check size={12} />
                  ) : null}
                </button>
              </th>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Account</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const cat = getCategory(t.categoryId);
              const acct = getAccount(t.accountId);
              return (
                <tr key={t.id} className={!t.reviewed ? 'unreviewed' : undefined}>
                  <td>
                    <button
                      className={clsx('check', (selected.includes(t.id) || t.reviewed) && 'on')}
                      onClick={() => {
                        if (selected.length) toggleSelect(t.id);
                        else markReviewed([t.id], !t.reviewed);
                      }}
                      aria-label={t.reviewed ? 'Mark unreviewed' : 'Mark reviewed'}
                    >
                      {(selected.includes(t.id) || t.reviewed) && <Check size={12} />}
                    </button>
                  </td>
                  <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {shortDate(t.date)}
                    {t.pending ? <div className="pill" style={{ marginTop: 4 }}>Pending</div> : null}
                  </td>
                  <td>
                    <div style={{ fontWeight: 650 }}>{t.merchant}</div>
                    {t.isRecurring ? <span className="pill blue">Recurring</span> : null}
                  </td>
                  <td>
                    <select
                      className="select-input"
                      style={{ minWidth: 160 }}
                      value={t.categoryId}
                      onChange={(e) => updateTransaction(t.id, { categoryId: e.target.value })}
                    >
                      {state.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className="pill">
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 99,
                          background: acct?.color,
                          display: 'inline-block',
                        }}
                      />
                      {acct?.name}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`amount ${t.amount > 0 ? 'pos' : ''}`}>
                      {formatCurrency(t.amount, { signed: true })}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn-icon"
                        title="Delete"
                        onClick={() => deleteTransaction(t.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {!cat ? null : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 ? <div className="empty">No transactions match your filters.</div> : null}
      </div>
    </div>
  );
}
