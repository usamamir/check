import { useState } from 'react'
import { getCurrentUser, updateCurrentUser } from '../lib/auth'
import { equipmentLabels, type Equipment } from '../data/exercises'

export function Settings() {
  const user = getCurrentUser()!
  const [goal, setGoal] = useState(user.goal ?? 'general')
  const [level, setLevel] = useState(user.level ?? 'beginner')
  const [equipment, setEquipment] = useState(user.equipment)
  const [daysPerWeek, setDaysPerWeek] = useState(user.daysPerWeek)
  const [saved, setSaved] = useState(false)

  function toggle(id: string) {
    setEquipment((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function save() {
    updateCurrentUser({
      goal: goal as 'strength' | 'hypertrophy' | 'general',
      level: level as 'beginner' | 'intermediate' | 'advanced',
      equipment,
      daysPerWeek,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Training profile</h1>
        </div>
        <button type="button" className="btn primary" onClick={save}>
          {saved ? 'Saved' : 'Save changes'}
        </button>
      </header>

      <div className="settings-card">
        <p>
          Signed in as <strong>{user.email}</strong>
        </p>

        <label>
          Goal
          <select value={goal ?? 'general'} onChange={(e) => setGoal(e.target.value as typeof goal)}>
            <option value="strength">Strength</option>
            <option value="hypertrophy">Hypertrophy</option>
            <option value="general">General fitness</option>
          </select>
        </label>

        <label>
          Level
          <select value={level ?? 'beginner'} onChange={(e) => setLevel(e.target.value as typeof level)}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </label>

        <div>
          <h3>Equipment</h3>
          <div className="chip-row wrap">
            {(Object.keys(equipmentLabels) as Equipment[]).map((g) => (
              <button
                key={g}
                type="button"
                className={`chip ${equipment.includes(g) ? 'on' : ''}`}
                onClick={() => toggle(g)}
              >
                {equipmentLabels[g]}
              </button>
            ))}
          </div>
        </div>

        <label>
          Days / week: {daysPerWeek}
          <input
            type="range"
            min={2}
            max={6}
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  )
}
