import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFinance } from '../store/FinanceContext';
import { formatCurrency } from '../lib/format';
import { Modal } from '../components/Modal';

export function Goals() {
  const { state, updateGoal, addGoal, deleteGoal } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '',
    emoji: '🎯',
    type: 'save' as 'save' | 'paydown',
    targetAmount: '',
    currentAmount: '',
    monthlyContribution: '',
    targetDate: '',
  });

  const submit = () => {
    if (!form.name.trim() || !form.targetAmount) return;
    addGoal({
      name: form.name.trim(),
      emoji: form.emoji || '🎯',
      type: form.type,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount) || 0,
      monthlyContribution: Number(form.monthlyContribution) || 0,
      targetDate: form.targetDate || new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    });
    setShowAdd(false);
    setForm({
      name: '',
      emoji: '🎯',
      type: 'save',
      targetAmount: '',
      currentAmount: '',
      monthlyContribution: '',
      targetDate: '',
    });
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="toolbar">
        <p className="card-meta" style={{ margin: 0 }}>
          Save-up and pay-down goals linked to your plan
        </p>
        <div className="filters">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> New goal
          </button>
        </div>
      </div>

      <div className="grid-3">
        {state.goals.map((g) => {
          const pct = Math.min(100, (g.currentAmount / Math.max(g.targetAmount, 1)) * 100);
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          return (
            <div className="card goal-card" key={g.id}>
              <div className="goal-head">
                <div className="goal-emoji">{g.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 750 }}>{g.name}</div>
                  <div className="card-meta">
                    {g.type === 'save' ? 'Save up' : 'Pay down'} · target{' '}
                    {new Date(g.targetDate + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <button className="btn-icon" onClick={() => deleteGoal(g.id)} title="Delete goal">
                  <Trash2 size={14} />
                </button>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="amount">{formatCurrency(g.currentAmount)}</span>
                  <span className="card-meta">of {formatCurrency(g.targetAmount)}</span>
                </div>
                <div className="progress">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 10 }}>
                <div className="field">
                  <label>Current</label>
                  <input
                    className="text-input"
                    type="number"
                    value={g.currentAmount}
                    onChange={(e) =>
                      updateGoal(g.id, { currentAmount: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="field">
                  <label>Monthly</label>
                  <input
                    className="text-input"
                    type="number"
                    value={g.monthlyContribution}
                    onChange={(e) =>
                      updateGoal(g.id, { monthlyContribution: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="pill accent" style={{ alignSelf: 'flex-start' }}>
                {formatCurrency(remaining)} to go
              </div>
            </div>
          );
        })}
      </div>

      {showAdd ? (
        <Modal
          title="Create goal"
          onClose={() => setShowAdd(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submit}>
                Create goal
              </button>
            </>
          }
        >
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input
                className="text-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="House down payment"
              />
            </div>
            <div className="field">
              <label>Emoji</label>
              <input
                className="text-input"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Type</label>
            <select
              className="select-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'save' | 'paydown' })}
            >
              <option value="save">Save up</option>
              <option value="paydown">Pay down</option>
            </select>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Target amount</label>
              <input
                className="text-input"
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Current amount</label>
              <input
                className="text-input"
                type="number"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
              />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Monthly contribution</label>
              <input
                className="text-input"
                type="number"
                value={form.monthlyContribution}
                onChange={(e) => setForm({ ...form, monthlyContribution: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Target date</label>
              <input
                className="text-input"
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
