import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '../components/Logo';
import { useFinance } from '../store/FinanceContext';

export function Login() {
  const { login, startFresh, loadSampleData, state } = useFinance();
  const navigate = useNavigate();
  const [name, setName] = useState(state.user.name && state.user.name !== 'Alex Rivera' ? state.user.name : '');
  const [email, setEmail] = useState(
    state.user.email && state.user.email !== 'alex@example.com' ? state.user.email : '',
  );

  const enterFresh = () => {
    startFresh({ name: name.trim() || 'Me', email: email.trim() });
    login();
    navigate('/accounts');
  };

  const enterSample = () => {
    loadSampleData();
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
            Track accounts, review transactions, budget with flex, and hit your goals — start empty
            with your own data, or explore a sample household first.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 1, color: '#a8a29e', fontSize: '0.85rem' }}>
          Your data stays on this device
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <h2>Get started</h2>
          <p className="lede">Choose how you want to begin.</p>

          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              className="text-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex"
            />
          </div>
          <div className="field" style={{ marginBottom: 18 }}>
            <label htmlFor="email">Email (optional)</label>
            <input
              id="email"
              className="text-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px 16px', marginBottom: 10 }}
            onClick={enterFresh}
          >
            Start from scratch
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', padding: '12px 16px' }}
            onClick={enterSample}
          >
            Explore with sample data
          </button>

          <div className="demo-note">
            Start from scratch clears the demo household so you can add your own accounts,
            transactions, budgets, and goals. Everything saves on this device — no bank login
            required.
          </div>
        </div>
      </section>
    </div>
  );
}
