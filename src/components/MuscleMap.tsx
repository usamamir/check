import type { Muscle } from '../data/exercises'
import { muscleLabels } from '../data/exercises'

type Props = {
  selected: Muscle[]
  onToggle: (m: Muscle) => void
}

/** Front + back clickable muscle diagram */
export function MuscleMap({ selected, onToggle }: Props) {
  const on = (m: Muscle) => selected.includes(m)

  const fill = (m: Muscle) => (on(m) ? '#b8ff3c' : '#2a3a34')
  const stroke = (m: Muscle) => (on(m) ? '#f3f7f2' : '#4a6258')

  return (
    <div className="muscle-map">
      <div className="map-panel">
        <p className="map-label">Front — tap a muscle</p>
        <svg viewBox="0 0 220 480" role="img" aria-label="Front body muscle map">
          {/* Head */}
          <ellipse cx="110" cy="28" rx="22" ry="26" fill="#1a2621" stroke="#4a6258" />
          {/* Torso outline */}
          <path
            d="M70 70 C70 55 150 55 150 70 L165 150 C170 190 165 230 155 260 L150 320 L70 320 L65 260 C55 230 50 190 55 150 Z"
            fill="#15201c"
            stroke="#3a4f47"
          />
          {/* Chest L/R */}
          <path
            d="M78 95 C90 80 105 82 110 100 C110 120 95 135 78 125 Z"
            fill={fill('chest')}
            stroke={stroke('chest')}
            className="muscle"
            onClick={() => onToggle('chest')}
          />
          <path
            d="M142 95 C130 80 115 82 110 100 C110 120 125 135 142 125 Z"
            fill={fill('chest')}
            stroke={stroke('chest')}
            className="muscle"
            onClick={() => onToggle('chest')}
          />
          {/* Shoulders */}
          <ellipse
            cx="58"
            cy="88"
            rx="22"
            ry="16"
            fill={fill('shoulders')}
            stroke={stroke('shoulders')}
            className="muscle"
            onClick={() => onToggle('shoulders')}
          />
          <ellipse
            cx="162"
            cy="88"
            rx="22"
            ry="16"
            fill={fill('shoulders')}
            stroke={stroke('shoulders')}
            className="muscle"
            onClick={() => onToggle('shoulders')}
          />
          {/* Biceps */}
          <rect
            x="28"
            y="110"
            width="28"
            height="70"
            rx="12"
            fill={fill('biceps')}
            stroke={stroke('biceps')}
            className="muscle"
            onClick={() => onToggle('biceps')}
          />
          <rect
            x="164"
            y="110"
            width="28"
            height="70"
            rx="12"
            fill={fill('biceps')}
            stroke={stroke('biceps')}
            className="muscle"
            onClick={() => onToggle('biceps')}
          />
          {/* Core */}
          <rect
            x="88"
            y="145"
            width="44"
            height="70"
            rx="10"
            fill={fill('core')}
            stroke={stroke('core')}
            className="muscle"
            onClick={() => onToggle('core')}
          />
          {/* Quads */}
          <rect
            x="72"
            y="325"
            width="30"
            height="95"
            rx="12"
            fill={fill('quads')}
            stroke={stroke('quads')}
            className="muscle"
            onClick={() => onToggle('quads')}
          />
          <rect
            x="118"
            y="325"
            width="30"
            height="95"
            rx="12"
            fill={fill('quads')}
            stroke={stroke('quads')}
            className="muscle"
            onClick={() => onToggle('quads')}
          />
          {/* Calves */}
          <rect
            x="74"
            y="425"
            width="26"
            height="45"
            rx="10"
            fill={fill('calves')}
            stroke={stroke('calves')}
            className="muscle"
            onClick={() => onToggle('calves')}
          />
          <rect
            x="120"
            y="425"
            width="26"
            height="45"
            rx="10"
            fill={fill('calves')}
            stroke={stroke('calves')}
            className="muscle"
            onClick={() => onToggle('calves')}
          />
        </svg>
      </div>

      <div className="map-panel">
        <p className="map-label">Back — tap a muscle</p>
        <svg viewBox="0 0 220 480" role="img" aria-label="Back body muscle map">
          <ellipse cx="110" cy="28" rx="22" ry="26" fill="#1a2621" stroke="#4a6258" />
          <path
            d="M70 70 C70 55 150 55 150 70 L165 150 C170 190 165 230 155 260 L150 320 L70 320 L65 260 C55 230 50 190 55 150 Z"
            fill="#15201c"
            stroke="#3a4f47"
          />
          {/* Traps / upper back as shoulders+back */}
          <path
            d="M70 80 C90 70 130 70 150 80 L145 130 L75 130 Z"
            fill={fill('back')}
            stroke={stroke('back')}
            className="muscle"
            onClick={() => onToggle('back')}
          />
          <path
            d="M78 135 L142 135 L140 210 L80 210 Z"
            fill={fill('back')}
            stroke={stroke('back')}
            className="muscle"
            onClick={() => onToggle('back')}
          />
          <ellipse
            cx="58"
            cy="88"
            rx="22"
            ry="16"
            fill={fill('shoulders')}
            stroke={stroke('shoulders')}
            className="muscle"
            onClick={() => onToggle('shoulders')}
          />
          <ellipse
            cx="162"
            cy="88"
            rx="22"
            ry="16"
            fill={fill('shoulders')}
            stroke={stroke('shoulders')}
            className="muscle"
            onClick={() => onToggle('shoulders')}
          />
          {/* Triceps on back of arms */}
          <rect
            x="28"
            y="110"
            width="28"
            height="70"
            rx="12"
            fill={fill('triceps')}
            stroke={stroke('triceps')}
            className="muscle"
            onClick={() => onToggle('triceps')}
          />
          <rect
            x="164"
            y="110"
            width="28"
            height="70"
            rx="12"
            fill={fill('triceps')}
            stroke={stroke('triceps')}
            className="muscle"
            onClick={() => onToggle('triceps')}
          />
          {/* Glutes */}
          <path
            d="M75 255 C90 245 130 245 145 255 L148 310 L72 310 Z"
            fill={fill('glutes')}
            stroke={stroke('glutes')}
            className="muscle"
            onClick={() => onToggle('glutes')}
          />
          {/* Hamstrings */}
          <rect
            x="72"
            y="315"
            width="30"
            height="100"
            rx="12"
            fill={fill('hamstrings')}
            stroke={stroke('hamstrings')}
            className="muscle"
            onClick={() => onToggle('hamstrings')}
          />
          <rect
            x="118"
            y="315"
            width="30"
            height="100"
            rx="12"
            fill={fill('hamstrings')}
            stroke={stroke('hamstrings')}
            className="muscle"
            onClick={() => onToggle('hamstrings')}
          />
          <rect
            x="74"
            y="425"
            width="26"
            height="45"
            rx="10"
            fill={fill('calves')}
            stroke={stroke('calves')}
            className="muscle"
            onClick={() => onToggle('calves')}
          />
          <rect
            x="120"
            y="425"
            width="26"
            height="45"
            rx="10"
            fill={fill('calves')}
            stroke={stroke('calves')}
            className="muscle"
            onClick={() => onToggle('calves')}
          />
        </svg>
      </div>

      <div className="selected-muscles">
        {selected.length === 0 ? (
          <p className="muted">No muscles selected yet — tap the body.</p>
        ) : (
          selected.map((m) => (
            <button key={m} type="button" className="chip on" onClick={() => onToggle(m)}>
              {muscleLabels[m]} ×
            </button>
          ))
        )}
      </div>
    </div>
  )
}
