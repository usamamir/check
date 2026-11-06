import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../lib/auth'

export function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await signup({ name, email, password })
    setBusy(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    navigate('/onboarding')
  }

  return (
    <div className="auth-page">
      <Link to="/" className="brand">
        REPWISE
      </Link>
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create your Repwise account</h1>
        <p className="muted">Accounts stay on this device—no server signup required.</p>
        {error && <div className="alert">{error}</div>}
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <button className="btn primary lg block" disabled={busy} type="submit">
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <p className="auth-switch">
          Already training? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
