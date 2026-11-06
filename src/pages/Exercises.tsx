import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  exercises,
  equipmentLabels,
  muscleLabels,
  type Equipment,
  type Muscle,
  getExercise,
} from '../data/exercises'
import { VideoModal } from '../components/VideoModal'

export function Exercises() {
  const [params, setParams] = useSearchParams()
  const watchId = params.get('watch')
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | 'all'>('all')
  const [equipment, setEquipment] = useState<Equipment | 'all'>('all')

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const text = `${ex.name} ${ex.muscles.join(' ')}`.toLowerCase()
      const okQ = !q || text.includes(q.toLowerCase())
      const okM = muscle === 'all' || ex.muscles.includes(muscle)
      const okE = equipment === 'all' || ex.equipment.includes(equipment)
      return okQ && okM && okE
    })
  }, [q, muscle, equipment])

  const active = watchId ? getExercise(watchId) ?? null : null

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Library</p>
          <h1>Exercises & demos</h1>
        </div>
      </header>

      <div className="filters">
        <input
          placeholder="Search exercises…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle | 'all')}>
          <option value="all">All muscles</option>
          {Object.entries(muscleLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value as Equipment | 'all')}
        >
          <option value="all">All equipment</option>
          {Object.entries(equipmentLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="exercise-grid">
        {filtered.map((ex) => (
          <article key={ex.id} className="ex-card">
            <button
              type="button"
              className="thumb"
              onClick={() => setParams({ watch: ex.id })}
              aria-label={`Play ${ex.name}`}
            >
              <img
                src={`https://i.ytimg.com/vi/${ex.youtubeId}/hqdefault.jpg`}
                alt=""
                loading="lazy"
              />
              <span className="play">▶</span>
            </button>
            <div className="ex-body">
              <h3>{ex.name}</h3>
              <p>
                {ex.muscles.map((m) => muscleLabels[m]).join(', ')}
              </p>
              <div className="ex-meta">
                <span>{ex.level}</span>
                <span>{ex.equipment.map((e) => equipmentLabels[e]).join(' / ')}</span>
              </div>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => setParams({ watch: ex.id })}
              >
                Watch demo
              </button>
            </div>
          </article>
        ))}
      </div>

      <VideoModal
        exercise={active}
        onClose={() => {
          params.delete('watch')
          setParams(params)
        }}
      />
    </div>
  )
}
