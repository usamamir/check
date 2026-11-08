import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  equipmentLabels,
  exercisesForMuscle,
  muscleGuides,
  muscleLabels,
  type Equipment,
  type Muscle,
} from '../data/exercises'
import { getEquipment } from '../lib/prefs'
import { VideoPlayer } from '../components/VideoPlayer'

const equipmentImage: Record<Equipment, string> = {
  barbell: 'equipment/barbell.jpg',
  dumbbell: 'equipment/dumbbell.jpg',
  cable: 'equipment/cable.jpg',
  machine: 'equipment/machine.jpg',
  bodyweight: 'equipment/bodyweight.jpg',
  kettlebell: 'equipment/kettlebell.jpg',
  band: 'equipment/band.jpg',
}

export function ExerciseBrowse() {
  const { muscleId } = useParams()
  const equipment = useMemo(() => getEquipment()[0] as Equipment | undefined, [])
  const muscle = (muscleId || '') as Muscle
  const valid = muscle in muscleLabels

  const [q, setQ] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const list = useMemo(() => {
    if (!valid || !equipment) return []
    return exercisesForMuscle(muscle, [equipment]).filter((ex) =>
      !q.trim() ? true : ex.name.toLowerCase().includes(q.trim().toLowerCase()),
    )
  }, [valid, muscle, equipment, q])

  useEffect(() => {
    setActiveId(list[0]?.id ?? null)
  }, [muscle, equipment, q, list])

  const active = list.find((e) => e.id === activeId) ?? list[0] ?? null
  const guide = valid ? muscleGuides[muscle] : null

  if (!equipment) {
    return (
      <div className="flow-page">
        <h1>Choose equipment first</h1>
        <Link className="btn primary" to="/">
          Choose a circle
        </Link>
      </div>
    )
  }

  if (!valid) {
    return (
      <div className="flow-page">
        <h1>Pick a muscle on the chart</h1>
        <Link className="btn primary" to="/muscles">
          Open anatomy map
        </Link>
      </div>
    )
  }

  return (
    <div className="browse-page">
      <header className="browse-head">
        <div>
          <p className="brand">REPWISE</p>
          <h1>
            {muscleLabels[muscle]} · {equipmentLabels[equipment]}
          </h1>
          <p className="muted">
            {list.length} exercises · click one and the video switches to that demo
          </p>
        </div>
        <div className="browse-links">
          <Link className="btn ghost sm" to="/">
            Equipment
          </Link>
          <Link className="btn ghost sm" to="/muscles">
            Anatomy
          </Link>
        </div>
      </header>

      <div className="chosen-equip">
        <img src={`${import.meta.env.BASE_URL}${equipmentImage[equipment]}`} alt="" />
        <div>
          <strong>{equipmentLabels[equipment]}</strong>
          <p className="muted">{muscleLabels[muscle]} only</p>
        </div>
      </div>

      {guide && (
        <section className="muscle-guide-inline">
          <strong>{guide.title}</strong>
          <p>{guide.summary}</p>
          <div className="tip-row">
            {guide.tips.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </section>
      )}

      <div className="browse-controls">
        <input
          className="search"
          placeholder={`Search ${equipmentLabels[equipment].toLowerCase()} ${muscleLabels[muscle].toLowerCase()} exercises…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {!list.length ? (
        <div className="empty">
          <p>
            No {equipmentLabels[equipment].toLowerCase()} exercises for {muscleLabels[muscle]}.
          </p>
          <Link className="btn primary" to="/muscles">
            Pick another muscle
          </Link>
        </div>
      ) : (
        <div className="browse-grid">
          <aside className="ex-list" aria-label="Exercise list">
            {list.map((ex, idx) => (
              <button
                key={ex.id}
                type="button"
                className={`ex-row ${active?.id === ex.id ? 'on' : ''}`}
                onClick={() => setActiveId(ex.id)}
              >
                <em>{idx + 1}</em>
                <div>
                  <strong>{ex.name}</strong>
                  <span>
                    {equipmentLabels[equipment]} · {ex.level}
                  </span>
                </div>
              </button>
            ))}
          </aside>

          {active && (
            <section className="ex-detail">
              <div className="detail-top">
                <div>
                  <h2>{active.name}</h2>
                  <p className="muted">
                    {equipmentLabels[equipment]} · {muscleLabels[muscle]}
                  </p>
                </div>
                <div className="detail-nav">
                  <button
                    type="button"
                    className="btn ghost sm"
                    disabled={list[0]?.id === active.id}
                    onClick={() => {
                      const i = list.findIndex((e) => e.id === active.id)
                      if (i > 0) setActiveId(list[i - 1].id)
                    }}
                  >
                    ← Prev
                  </button>
                  <button
                    type="button"
                    className="btn ghost sm"
                    disabled={list[list.length - 1]?.id === active.id}
                    onClick={() => {
                      const i = list.findIndex((e) => e.id === active.id)
                      if (i >= 0 && i < list.length - 1) setActiveId(list[i + 1].id)
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <VideoPlayer
                key={active.id}
                youtubeId={active.youtubeId}
                title={active.name}
                autoplay
              />

              <h3 className="cues-title">Guidelines</h3>
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
