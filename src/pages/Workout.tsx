import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getCurrentUser } from '../lib/auth'
import { getExercise } from '../data/exercises'
import {
  buildTodaysWorkout,
  getActiveWorkout,
  saveLog,
  setActiveWorkout,
  startWorkoutFromPlan,
  type WorkoutLog,
} from '../lib/workouts'
import { VideoModal } from '../components/VideoModal'

export function Workout() {
  const user = getCurrentUser()!
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [log, setLog] = useState<WorkoutLog | null>(null)
  const [watchId, setWatchId] = useState<string | null>(null)

  useEffect(() => {
    let active = getActiveWorkout()
    if (!active && params.get('start') === '1') {
      active = startWorkoutFromPlan(buildTodaysWorkout(user))
    }
    setLog(active)
  }, [params, user])

  const progress = useMemo(() => {
    if (!log) return 0
    const sets = Object.values(log.entries).flat()
    if (!sets.length) return 0
    return Math.round((sets.filter((s) => s.done).length / sets.length) * 100)
  }, [log])

  function updateSet(exerciseId: string, index: number, patch: Partial<WorkoutLog['entries'][string][number]>) {
    if (!log) return
    const next: WorkoutLog = {
      ...log,
      entries: {
        ...log.entries,
        [exerciseId]: log.entries[exerciseId].map((s, i) => (i === index ? { ...s, ...patch } : s)),
      },
    }
    setLog(next)
    setActiveWorkout(next)
  }

  function finish() {
    if (!log) return
    const done = { ...log, completed: true }
    saveLog(done)
    setActiveWorkout(null)
    navigate('/app/history')
  }

  if (!log) {
    return (
      <div className="page">
        <h1>No active workout</h1>
        <p className="muted">Start today’s plan from the dashboard.</p>
        <Link className="btn primary" to="/app">
          Back to today
        </Link>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">In progress · {progress}%</p>
          <h1>{log.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn ghost"
            onClick={() => navigate('/app')}
          >
            Save &amp; exit
          </button>
          <button type="button" className="btn primary" onClick={finish}>
            Finish workout
          </button>
        </div>
      </header>

      <div className="progress-bar">
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="workout-stack">
        {Object.keys(log.entries).map((exerciseId) => {
          const ex = getExercise(exerciseId)
          if (!ex) return null
          return (
            <section key={exerciseId} className="lift-card">
              <div className="lift-head">
                <div>
                  <h2>{ex.name}</h2>
                  <p className="muted">{ex.cues[0]}</p>
                </div>
                <button type="button" className="btn ghost sm" onClick={() => setWatchId(ex.id)}>
                  Demo
                </button>
              </div>
              <div className="set-table">
                <div className="set-row head">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>Weight</span>
                  <span>Done</span>
                </div>
                {log.entries[exerciseId].map((set, i) => (
                  <div className="set-row" key={i}>
                    <span>{i + 1}</span>
                    <input
                      type="number"
                      min={0}
                      value={set.reps}
                      onChange={(e) => updateSet(exerciseId, i, { reps: Number(e.target.value) })}
                    />
                    <input
                      type="number"
                      min={0}
                      value={set.weight}
                      onChange={(e) => updateSet(exerciseId, i, { weight: Number(e.target.value) })}
                    />
                    <input
                      type="checkbox"
                      checked={set.done}
                      onChange={(e) => updateSet(exerciseId, i, { done: e.target.checked })}
                    />
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <VideoModal exercise={watchId ? getExercise(watchId) ?? null : null} onClose={() => setWatchId(null)} />
    </div>
  )
}
