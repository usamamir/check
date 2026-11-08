import { Link, useNavigate } from 'react-router-dom'
import { MuscleMap } from '../components/MuscleMap'
import { equipmentLabels, type Equipment, type Muscle } from '../data/exercises'
import { getEquipment, setMuscles } from '../lib/prefs'

const equipmentImage: Record<Equipment, string> = {
  barbell: 'equipment/barbell.jpg',
  dumbbell: 'equipment/dumbbell.jpg',
  cable: 'equipment/cable.jpg',
  machine: 'equipment/machine.jpg',
  bodyweight: 'equipment/bodyweight.jpg',
  kettlebell: 'equipment/kettlebell.jpg',
  band: 'equipment/band.jpg',
}

export function MusclesPage() {
  const navigate = useNavigate()
  const equipment = getEquipment()[0]

  if (!equipment) {
    return (
      <div className="flow-page">
        <h1>Pick a piece of equipment</h1>
        <Link className="btn primary" to="/">
          Choose a circle
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
        <p className="eyebrow">Anatomy · {equipmentLabels[equipment]}</p>
        <h1>Tap a muscle on the chart</h1>
        <p className="muted">
          Front view is on the left, back view on the right. Exercises will match{' '}
          {equipmentLabels[equipment].toLowerCase()} and the muscle you choose.
        </p>
      </header>

      <div className="chosen-equip">
        <img
          src={`${import.meta.env.BASE_URL}${equipmentImage[equipment]}`}
          alt=""
        />
        <div>
          <strong>{equipmentLabels[equipment]}</strong>
          <p className="muted">Selected equipment</p>
        </div>
        <Link className="btn ghost sm" to="/">
          Change
        </Link>
      </div>

      <MuscleMap selected={null} onSelect={openMuscle} />
    </div>
  )
}
