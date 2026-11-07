import { Link, useNavigate } from 'react-router-dom'
import { MuscleMap } from '../components/MuscleMap'
import type { Muscle } from '../data/exercises'
import { getEquipment, setMuscles } from '../lib/prefs'

export function MusclesPage() {
  const navigate = useNavigate()
  const equipment = getEquipment()

  if (!equipment.length) {
    return (
      <div className="flow-page">
        <h1>Pick equipment first</h1>
        <Link className="btn primary" to="/">
          Choose equipment
        </Link>
      </div>
    )
  }

  function openMuscle(m: Muscle) {
    setMuscles([m])
    navigate(`/exercises/${m}`)
  }

  return (
    <div className="flow-page wide">
      <header className="flow-hero">
        <p className="eyebrow">Step 2 · Anatomy map</p>
        <h1>Tap a muscle on the chart</h1>
        <p className="muted">
          Front view (left) and back view (right) — same layout as a musculature anatomy poster.
          Your gear: {equipment.join(', ')}.
        </p>
      </header>

      <MuscleMap selected={null} onSelect={openMuscle} />

      <div className="flow-actions">
        <Link className="btn ghost" to="/">
          ← Equipment
        </Link>
      </div>
    </div>
  )
}
