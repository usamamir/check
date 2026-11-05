import { useFinance } from '../store/FinanceContext';

export function Settings() {
  const { state, setBudgetMode, resetDemo, logout } = useFinance();

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <div className="card card-pad">
        <h3 className="card-title">Profile</h3>
        <div className="card-meta" style={{ marginBottom: 14 }}>
          Household details for this demo workspace
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Name</label>
            <input className="text-input" value={state.user.name} readOnly />
          </div>
          <div className="field">
            <label>Email</label>
            <input className="text-input" value={state.user.email} readOnly />
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Partner</label>
          <input className="text-input" value={state.user.partnerName ?? ''} readOnly />
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
          {state.categories.length} categories across your household
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
        <h3 className="card-title">Demo data</h3>
        <p className="card-meta" style={{ marginTop: 6, marginBottom: 14, lineHeight: 1.5 }}>
          Changes stay in this browser via local storage. Reset anytime to restore the original
          sample household.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={resetDemo}>
            Reset sample data
          </button>
          <button className="btn btn-danger" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
