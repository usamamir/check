import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MuscleMap } from '../components/MuscleMap'
import type { Muscle } from '../data/exercises'
import { getEquipment, getMuscles, setMuscles } from '../lib/prefs'

export function MusclesPage() {
  const navigate = useNavigate()
  const equipment = getEquipment()
  const [selected, setSelected] = useState<Muscle[]>(() => getMuscles())

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

  function toggle(m: Muscle) {
    setSelected((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]))
  }

  function continueNext() {
    setMuscles(selected)
    navigate('/exercises')
  }

  return (
    <div className="flow-page">
      <header className="flow-hero">
        <p className="eyebrow">Step 2</p>
        <h1>Tap the muscles you want to train</h1>
        <p className="muted">
          Equipment locked in: {equipment.join(', ')}. Click body regions on the diagram.
        </p>
      </header>

      <MuscleMap selected={selected} onToggle={toggle} />

      <div className="flow-actions">
        <Link className="btn ghost" to="/">
          ← Equipment
        </Link>
        <button
          type="button"
          className="btn primary lg"
          onClick={continueNext}
          disabled={!selected.length}
        >
          Show exercises →
        </button>
      </div>
    </div>
  )
}
