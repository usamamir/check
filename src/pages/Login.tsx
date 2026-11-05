import { useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/Logo';
import { useFinance } from '../store/FinanceContext';

export function Login() {
  const { login, state } = useFinance();
  const navigate = useNavigate();

  const enter = () => {
    login();
    navigate('/');
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-brand">
          <div
            className="logo"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <LogoMark size={22} />
          </div>
          Monarch
        </div>
        <div className="login-copy">
          <h1>Your home base for money clarity</h1>
          <p>
            Track accounts, review transactions, budget with flex, and hit your goals — all in one
            place. Built as a working demo of the Monarch experience with sample household data.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, color: '#a8a29e', fontSize: '0.85rem' }}>
          Shared with {state.user.partnerName} · Sample data only
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <h2>Welcome back</h2>
          <p className="lede">Sign in to continue managing your finances.</p>

          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="email">Email</label>
            <input id="email" className="text-input" defaultValue={state.user.email} readOnly />
          </div>
          <div className="field" style={{ marginBottom: 18 }}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="text-input" defaultValue="••••••••" readOnly />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '12px 16px' }} onClick={enter}>
            Enter demo workspace
          </button>

          <div className="demo-note">
            This is a fully interactive clone with sample accounts, budgets, goals, and transactions.
            Changes are saved in your browser. No real bank connections.
          </div>
        </div>
      </section>
    </div>
  );
}
