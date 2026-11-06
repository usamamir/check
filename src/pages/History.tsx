import { Link } from 'react-router-dom'
import { readLogs } from '../lib/workouts'

export function History() {
  const logs = readLogs()

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">History</p>
          <h1>Past sessions</h1>
        </div>
      </header>

      {!logs.length ? (
        <div className="empty">
          <p>No completed workouts yet.</p>
          <Link className="btn primary" to="/app">
            Start today’s session
          </Link>
        </div>
      ) : (
        <ul className="history-list">
          {logs.map((log) => {
            const sets = Object.values(log.entries).flat()
            const done = sets.filter((s) => s.done).length
            return (
              <li key={log.id}>
                <div>
                  <strong>{log.title}</strong>
                  <span>{new Date(log.date).toLocaleString()}</span>
                </div>
                <em>
                  {done}/{sets.length} sets · {log.completed ? 'Completed' : 'Saved'}
                </em>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
