import { Link } from 'react-router-dom'
import { getCurrentUser } from '../lib/auth'
import { buildTodaysWorkout, getActiveWorkout } from '../lib/workouts'
import { getExercise } from '../data/exercises'

export function Dashboard() {
  const user = getCurrentUser()!
  const plan = buildTodaysWorkout(user)
  const active = getActiveWorkout()

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Hello, {user.name.split(' ')[0]}</p>
          <h1>Today’s workout</h1>
        </div>
        <Link className="btn primary" to={active ? '/app/workout' : '/app/workout?start=1'}>
          {active ? 'Resume workout' : 'Start workout'}
        </Link>
      </header>

      <section className="plan-card">
        <div className="plan-meta">
          <h2>{plan.title}</h2>
          <p>
            Focus: {plan.focus} · ~{plan.estimatedMinutes} min · {plan.items.length} lifts
          </p>
        </div>
        <ol className="plan-list">
          {plan.items.map((item, i) => {
            const ex = getExercise(item.exerciseId)
            if (!ex) return null
            return (
              <li key={item.exerciseId}>
                <span className="idx">{i + 1}</span>
                <div>
                  <strong>{ex.name}</strong>
                  <em>
                    {item.sets} sets · {item.reps} reps
                  </em>
                </div>
                <Link className="btn ghost sm" to={`/app/exercises?watch=${ex.id}`}>
                  Watch
                </Link>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="quick-links">
        <Link to="/app/exercises" className="tile">
          <strong>Exercise library</strong>
          <span>Browse demos and cues</span>
        </Link>
        <Link to="/app/history" className="tile">
          <strong>History</strong>
          <span>Past sessions on this device</span>
        </Link>
        <Link to="/app/settings" className="tile">
          <strong>Training profile</strong>
          <span>Goal, level, equipment</span>
        </Link>
      </section>
    </div>
  )
}
