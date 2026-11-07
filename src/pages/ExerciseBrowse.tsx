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

export function ExerciseBrowse() {
  const { muscleId } = useParams()
  const equipment = useMemo(() => getEquipment() as Equipment[], [])
  const equipmentKey = equipment.join(',')
  const muscle = (muscleId || '') as Muscle
  const valid = muscle in muscleLabels

  const [q, setQ] = useState('')
  const [equipFilter, setEquipFilter] = useState<'all' | Equipment>('all')
  const [activeId, setActiveId] = useState<string | null>(null)

  const list = useMemo(() => {
    if (!valid) return []
    const baseEquip = equipFilter === 'all' ? equipment : [equipFilter]
    return exercisesForMuscle(muscle, baseEquip).filter((ex) =>
      !q.trim() ? true : ex.name.toLowerCase().includes(q.trim().toLowerCase()),
    )
  }, [valid, muscle, equipment, equipFilter, q])

  useEffect(() => {
    if (!valid) {
      setActiveId(null)
      return
    }
    const baseEquip = equipFilter === 'all' ? equipment : [equipFilter]
    const filtered = exercisesForMuscle(muscle, baseEquip).filter((ex) =>
      !q.trim() ? true : ex.name.toLowerCase().includes(q.trim().toLowerCase()),
    )
    setActiveId(filtered[0]?.id ?? null)
  }, [muscle, equipFilter, q, equipmentKey, valid, equipment])

  const active = list.find((e) => e.id === activeId) ?? list[0] ?? null
  const guide = valid ? muscleGuides[muscle] : null
  const availableEquip = useMemo(() => {
    if (!valid) return [] as Equipment[]
    const set = new Set<Equipment>()
    exercisesForMuscle(muscle, equipment).forEach((ex) => ex.equipment.forEach((e) => set.add(e)))
    return equipment.filter((e) => set.has(e))
  }, [valid, muscle, equipment])

  if (!equipment.length) {
    return (
      <div className="flow-page">
        <h1>Choose equipment first</h1>
        <Link className="btn primary" to="/">
          Start
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
          <h1>{muscleLabels[muscle]} exercises</h1>
          <p className="muted">
            {list.length} demos for your gear · click any exercise to switch the video
          </p>
        </div>
        <div className="browse-links">
          <Link className="btn ghost sm" to="/">
            Equipment
          </Link>
          <Link className="btn ghost sm" to="/muscles">
            Anatomy map
          </Link>
        </div>
      </header>

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
          placeholder="Search this muscle’s exercises…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chip-row wrap">
          <button
            type="button"
            className={`chip ${equipFilter === 'all' ? 'on' : ''}`}
            onClick={() => setEquipFilter('all')}
          >
            All my gear
          </button>
          {availableEquip.map((e) => (
            <button
              key={e}
              type="button"
              className={`chip ${equipFilter === e ? 'on' : ''}`}
              onClick={() => setEquipFilter(e)}
            >
              {equipmentLabels[e]}
            </button>
          ))}
        </div>
      </div>

      {!list.length ? (
        <div className="empty">
          <p>No exercises for this muscle with the current equipment filter.</p>
          <button type="button" className="btn primary" onClick={() => setEquipFilter('all')}>
            Show all my gear
          </button>
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
                    {ex.equipment.map((e) => equipmentLabels[e]).join(' / ')} · {ex.level}
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
                    {active.equipment.map((e) => equipmentLabels[e]).join(', ')} · video updates when
                    you pick another exercise
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
