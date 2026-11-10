import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../store/FinanceContext';
import { Modal } from '../components/Modal';

export function Settings() {
  const {
    state,
    isBlank,
    setBudgetMode,
    startFresh,
    loadSampleData,
    updateUser,
    deleteAllTransactions,
    logout,
  } = useFinance();
  const navigate = useNavigate();
  const [confirmFresh, setConfirmFresh] = useState(false);
  const [confirmDeleteTx, setConfirmDeleteTx] = useState(false);
  const [confirmSample, setConfirmSample] = useState(false);
  const [savedFlash, setSavedFlash] = useState('');

  const flash = (msg: string) => {
    setSavedFlash(msg);
    window.setTimeout(() => setSavedFlash(''), 2500);
  };

  const eraseEverything = () => {
    startFresh({
      name: state.user.name,
      email: state.user.email,
      initials: state.user.initials,
      partnerName: state.user.partnerName,
    });
    setConfirmFresh(false);
    flash('All data erased. Add your own accounts to begin.');
    navigate('/accounts');
  };

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      {savedFlash ? (
        <div className="card card-pad" style={{ background: 'var(--positive-soft)', borderColor: '#a7e3c5' }}>
          {savedFlash}
        </div>
      ) : null}

      <div className="card card-pad" style={{ borderColor: '#ffc9ba', background: '#fff8f5' }}>
        <h3 className="card-title">Your data</h3>
        <p className="card-meta" style={{ marginTop: 6, marginBottom: 14, lineHeight: 1.5 }}>
          {isBlank
            ? 'Workspace is empty — add accounts, transactions, budgets, and goals as your own.'
            : `${state.accounts.length} accounts · ${state.transactions.length} transactions · ${state.goals.length} goals · ${state.recurring.length} recurring`}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-danger" onClick={() => setConfirmFresh(true)}>
            Erase all data & start from scratch
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setConfirmDeleteTx(true)}
            disabled={state.transactions.length === 0}
          >
            Delete all transactions
          </button>
          <button className="btn btn-secondary" onClick={() => setConfirmSample(true)}>
            Load sample data
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="card-title">Profile</h3>
        <div className="card-meta" style={{ marginBottom: 14 }}>
          Edit your household details
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Name</label>
            <input
              className="text-input"
              value={state.user.name}
              onChange={(e) => updateUser({ name: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              className="text-input"
              value={state.user.email}
              onChange={(e) => updateUser({ email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Partner (optional)</label>
          <input
            className="text-input"
            value={state.user.partnerName ?? ''}
            onChange={(e) => updateUser({ partnerName: e.target.value })}
            placeholder="Partner name"
          />
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="card-title">Budget preferences</h3>
        <div className="card-meta" style={{ marginBottom: 12 }}>
          Switch between flex and category budgeting
        </div>
        <div className="segmented">
          <button
            className={state.budgetMode === 'flex' ? 'active' : ''}
            onClick={() => setBudgetMode('flex')}
          >
            Flex budgeting
          </button>
          <button
            className={state.budgetMode === 'category' ? 'active' : ''}
            onClick={() => setBudgetMode('category')}
          >
            Category budgeting
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="card-title">Categories</h3>
        <div className="card-meta" style={{ marginBottom: 12 }}>
          {state.categories.length} categories ready for your transactions
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {state.categories.map((c) => (
            <span className="pill" key={c.id}>
              {c.emoji} {c.name}
            </span>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="card-title">Session</h3>
        <button className="btn btn-secondary" onClick={logout} style={{ marginTop: 8 }}>
          Sign out
        </button>
      </div>

      {confirmFresh ? (
        <Modal
          title="Erase all data?"
          onClose={() => setConfirmFresh(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmFresh(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={eraseEverything}>
                Yes, erase everything
              </button>
            </>
          }
        >
          <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            This permanently deletes all accounts, transactions, budgets amounts, goals, and
            recurring items in this workspace. Categories stay so you can rebuild with your own
            numbers. This cannot be undone (unless you load sample data again).
          </p>
        </Modal>
      ) : null}

      {confirmDeleteTx ? (
        <Modal
          title="Delete all transactions?"
          onClose={() => setConfirmDeleteTx(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteTx(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  deleteAllTransactions();
                  setConfirmDeleteTx(false);
                  flash('All transactions deleted.');
                }}
              >
                Delete {state.transactions.length} transactions
              </button>
            </>
          }
        >
          <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            Account balances are left as-is. Only the transaction list is cleared.
          </p>
        </Modal>
      ) : null}

      {confirmSample ? (
        <Modal
          title="Load sample data?"
          onClose={() => setConfirmSample(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConfirmSample(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  loadSampleData();
                  setConfirmSample(false);
                  flash('Sample household loaded.');
                  navigate('/');
                }}
              >
                Replace with sample data
              </button>
            </>
          }
        >
          <p style={{ margin: 0, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            This replaces your current workspace with the built-in demo household (Alex Rivera).
            Your own data will be overwritten.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
