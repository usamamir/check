import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { Exercises } from './pages/Exercises'
import { Workout } from './pages/Workout'
import { History } from './pages/History'
import { Settings } from './pages/Settings'
import { getCurrentUser } from './lib/auth'

// HashRouter works reliably inside Electron file:// packaging
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter

function OnboardingGate() {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  return <Onboarding />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/onboarding" element={<OnboardingGate />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="workout" element={<Workout />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
