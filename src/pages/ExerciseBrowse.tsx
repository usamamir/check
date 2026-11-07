import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  equipmentLabels,
  filterExercises,
  muscleLabels,
  type Equipment,
  type Muscle,
} from '../data/exercises'
import { getEquipment, getMuscles } from '../lib/prefs'
import { VideoPlayer } from '../components/VideoPlayer'

export function ExerciseBrowse() {
  const equipment = getEquipment() as Equipment[]
  const muscles = getMuscles() as Muscle[]
  const [q, setQ] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const list = useMemo(
    () => filterExercises({ equipment, muscles, query: q }),
    [equipment, muscles, q],
  )

  const active = list.find((e) => e.id === activeId) ?? list[0] ?? null

  if (!equipment.length || !muscles.length) {
    return (
      <div className="flow-page">
        <h1>Finish setup first</h1>
        <p className="muted">Choose equipment and tap muscles on the body map.</p>
        <div className="flow-actions">
          <Link className="btn primary" to="/">
            Start over
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="browse-page">
      <header className="browse-head">
        <div>
          <p className="brand">REPWISE</p>
          <h1>
            {muscles.map((m) => muscleLabels[m]).join(' + ')}
          </h1>
          <p className="muted">
            Using {equipment.map((e) => equipmentLabels[e]).join(', ')} · {list.length} demos
          </p>
        </div>
        <div className="browse-links">
          <Link className="btn ghost sm" to="/">
            Equipment
          </Link>
          <Link className="btn ghost sm" to="/muscles">
            Muscles
          </Link>
        </div>
      </header>

      <input
        className="search"
        placeholder="Search exercises…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {!list.length ? (
        <div className="empty">
          <p>No exercises match that equipment + muscle mix.</p>
          <Link className="btn primary" to="/muscles">
            Change muscles
          </Link>
        </div>
      ) : (
        <div className="browse-grid">
          <aside className="ex-list">
            {list.map((ex) => (
              <button
                key={ex.id}
                type="button"
                className={`ex-row ${active?.id === ex.id ? 'on' : ''}`}
                onClick={() => setActiveId(ex.id)}
              >
                <strong>{ex.name}</strong>
                <span>
                  {ex.equipment.map((e) => equipmentLabels[e]).join(' / ')} · {ex.level}
                </span>
              </button>
            ))}
          </aside>

          {active && (
            <section className="ex-detail">
              <h2>{active.name}</h2>
              <p className="muted">
                {active.muscles.map((m) => muscleLabels[m]).join(', ')}
              </p>
              <VideoPlayer youtubeId={active.youtubeId} title={active.name} />
              <ul className="cue-list">
                {active.cues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
