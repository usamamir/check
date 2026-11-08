import { useNavigate } from 'react-router-dom'
import { allEquipment, equipmentLabels, type Equipment } from '../data/exercises'
import { setEquipment } from '../lib/prefs'

const equipmentImage: Record<Equipment, string> = {
  barbell: 'equipment/barbell.jpg',
  dumbbell: 'equipment/dumbbell.jpg',
  cable: 'equipment/cable.jpg',
  machine: 'equipment/machine.jpg',
  bodyweight: 'equipment/bodyweight.jpg',
  kettlebell: 'equipment/kettlebell.jpg',
  band: 'equipment/band.jpg',
}

export function EquipmentPage() {
  const navigate = useNavigate()

  function choose(eq: Equipment) {
    setEquipment([eq])
    navigate('/muscles')
  }

  return (
    <div className="flow-page wide">
      <header className="flow-hero center">
        <p className="brand">REPWISE</p>
        <h1>Choose your equipment</h1>
        <p className="muted">
          Tap a circle. You’ll get the anatomy chart next, then exercises for the muscle you tap
          and this equipment.
        </p>
      </header>

      <div className="circle-grid">
        {allEquipment.map((eq) => (
          <button key={eq} type="button" className="equip-circle" onClick={() => choose(eq)}>
            <img
              src={`${import.meta.env.BASE_URL}${equipmentImage[eq]}`}
              alt=""
            />
            <strong>{equipmentLabels[eq]}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}
