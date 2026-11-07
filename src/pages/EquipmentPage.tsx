import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { allEquipment, equipmentLabels, type Equipment } from '../data/exercises'
import { getEquipment, setEquipment } from '../lib/prefs'

export function EquipmentPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Equipment[]>(() => {
    const saved = getEquipment()
    return saved.length ? saved : ['dumbbell', 'bodyweight']
  })

  function toggle(eq: Equipment) {
    setSelected((prev) => (prev.includes(eq) ? prev.filter((x) => x !== eq) : [...prev, eq]))
  }

  function continueNext() {
    const list = selected.length ? selected : (['bodyweight'] as Equipment[])
    setEquipment(list)
    navigate('/muscles')
  }

  return (
    <div className="flow-page">
      <header className="flow-hero">
        <p className="brand">REPWISE</p>
        <h1>What equipment do you have?</h1>
        <p className="muted">Pick everything available. We’ll only show matching exercises.</p>
      </header>

      <div className="equip-grid">
        {allEquipment.map((eq) => (
          <button
            key={eq}
            type="button"
            className={`equip-card ${selected.includes(eq) ? 'on' : ''}`}
            onClick={() => toggle(eq)}
          >
            <strong>{equipmentLabels[eq]}</strong>
            <span>{selected.includes(eq) ? 'Selected' : 'Tap to add'}</span>
          </button>
        ))}
      </div>

      <div className="flow-actions">
        <button type="button" className="btn primary lg" onClick={continueNext} disabled={!selected.length}>
          Choose body parts →
        </button>
      </div>
    </div>
  )
}
