import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../lib/auth'

export function AppShell() {
  const user = getCurrentUser()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <Link to="/app" className="brand">
          REPWISE
        </Link>
        <nav className="app-nav" aria-label="App">
          <NavLink to="/app" end>
            Today
          </NavLink>
          <NavLink to="/app/exercises">Exercises</NavLink>
          <NavLink to="/app/workout">Workout</NavLink>
          <NavLink to="/app/history">History</NavLink>
          <NavLink to="/app/settings">Settings</NavLink>
        </nav>
        <div className="topbar-user">
          <span>{user?.name?.split(' ')[0] ?? 'Athlete'}</span>
          <button
            type="button"
            className="btn ghost sm"
            onClick={() => {
              logout()
              navigate('/login')
            }}
          >
            Log out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
