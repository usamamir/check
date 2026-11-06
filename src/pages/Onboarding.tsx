import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, updateCurrentUser } from '../lib/auth'
import { equipmentLabels, type Equipment } from '../data/exercises'

const goals = [
  { id: 'strength', label: 'Get stronger', desc: 'Lower reps, progressive overload' },
  { id: 'hypertrophy', label: 'Build muscle', desc: 'Moderate volume and control' },
  { id: 'general', label: 'Stay fit', desc: 'Balanced full-body training' },
] as const

const levels = ['beginner', 'intermediate', 'advanced'] as const
const gear = Object.keys(equipmentLabels) as Equipment[]

export function Onboarding() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const [goal, setGoal] = useState<(typeof goals)[number]['id']>('hypertrophy')
  const [level, setLevel] = useState<(typeof levels)[number]>('beginner')
  const [equipment, setEquipment] = useState<string[]>(user?.equipment ?? ['dumbbell', 'bodyweight'])
  const [daysPerWeek, setDaysPerWeek] = useState(user?.daysPerWeek ?? 3)

  function toggleEquip(id: string) {
    setEquipment((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function finish() {
    updateCurrentUser({
      goal,
      level,
      equipment: equipment.length ? equipment : ['bodyweight'],
      daysPerWeek,
      onboardingDone: true,
    })
    navigate('/app')
  }

  return (
    <div className="auth-page onboarding">
      <div className="auth-card wide">
        <p className="eyebrow">Quick setup</p>
        <h1>Tell Repwise how you train</h1>
        <p className="muted">We’ll use this to build today’s session and filter the library.</p>

        <h3>Goal</h3>
        <div className="choice-grid">
          {goals.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`choice ${goal === g.id ? 'on' : ''}`}
              onClick={() => setGoal(g.id)}
            >
              <strong>{g.label}</strong>
              <span>{g.desc}</span>
            </button>
          ))}
        </div>

        <h3>Experience</h3>
        <div className="chip-row">
          {levels.map((l) => (
            <button
              key={l}
              type="button"
              className={`chip ${level === l ? 'on' : ''}`}
              onClick={() => setLevel(l)}
            >
              {l}
            </button>
          ))}
        </div>

        <h3>Equipment you have</h3>
        <div className="chip-row wrap">
          {gear.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip ${equipment.includes(g) ? 'on' : ''}`}
              onClick={() => toggleEquip(g)}
            >
              {equipmentLabels[g]}
            </button>
          ))}
        </div>

        <h3>Days per week</h3>
        <input
          type="range"
          min={2}
          max={6}
          value={daysPerWeek}
          onChange={(e) => setDaysPerWeek(Number(e.target.value))}
        />
        <p className="muted">{daysPerWeek} days</p>

        <button type="button" className="btn primary lg block" onClick={finish}>
          Build my first workout
        </button>
      </div>
    </div>
  )
}
