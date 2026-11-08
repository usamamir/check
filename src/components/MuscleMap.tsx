import type { CSSProperties } from 'react'
import type { Muscle } from '../data/exercises'
import { muscleLabels } from '../data/exercises'

type Props = {
  selected: Muscle | null
  onSelect: (m: Muscle) => void
}

type Hotspot = {
  id: Muscle
  label: string
  color: string
  /** percent positions relative to full anatomy chart image */
  style: { left: string; top: string; width: string; height: string }
}

/** Chart-matched colors (front/back musculature poster) */
const muscleColor: Record<Muscle, string> = {
  chest: '#8B5A2B',
  back: '#7B3FA0',
  shoulders: '#E08A3C',
  biceps: '#C43C3C',
  triceps: '#D45A6A',
  core: '#C45A6A',
  quads: '#3B5CC4',
  hamstrings: '#4A2F8A',
  glutes: '#3D6BC7',
  calves: '#2E9B4F',
}

/**
 * Hotspots aligned to the musculature anatomy chart (front left / back right).
 * Coordinates are % of the full poster image.
 */
const hotspots: Hotspot[] = [
  // FRONT (left figure)
  { id: 'chest', label: 'Pectoralis Major', color: muscleColor.chest, style: { left: '18%', top: '19%', width: '15%', height: '11%' } },
  { id: 'shoulders', label: 'Deltoids', color: muscleColor.shoulders, style: { left: '13%', top: '15%', width: '7%', height: '8%' } },
  { id: 'shoulders', label: 'Deltoids', color: muscleColor.shoulders, style: { left: '31%', top: '15%', width: '7%', height: '8%' } },
  { id: 'biceps', label: 'Biceps', color: muscleColor.biceps, style: { left: '10%', top: '25%', width: '6.5%', height: '12%' } },
  { id: 'biceps', label: 'Biceps', color: muscleColor.biceps, style: { left: '34.5%', top: '25%', width: '6.5%', height: '12%' } },
  { id: 'core', label: 'Abs / Obliques', color: muscleColor.core, style: { left: '19.5%', top: '31%', width: '12%', height: '15%' } },
  { id: 'quads', label: 'Quadriceps', color: muscleColor.quads, style: { left: '17%', top: '49%', width: '17%', height: '20%' } },
  { id: 'calves', label: 'Calves', color: muscleColor.calves, style: { left: '18%', top: '71%', width: '15%', height: '13%' } },
  // BACK (right figure)
  { id: 'back', label: 'Lats / Traps', color: muscleColor.back, style: { left: '65%', top: '16%', width: '18%', height: '24%' } },
  { id: 'shoulders', label: 'Rear Delts', color: muscleColor.shoulders, style: { left: '61%', top: '15%', width: '6.5%', height: '8%' } },
  { id: 'shoulders', label: 'Rear Delts', color: muscleColor.shoulders, style: { left: '80.5%', top: '15%', width: '6.5%', height: '8%' } },
  { id: 'triceps', label: 'Triceps', color: muscleColor.triceps, style: { left: '58%', top: '25%', width: '6.5%', height: '12%' } },
  { id: 'triceps', label: 'Triceps', color: muscleColor.triceps, style: { left: '83.5%', top: '25%', width: '6.5%', height: '12%' } },
  { id: 'glutes', label: 'Gluteus Maximus', color: muscleColor.glutes, style: { left: '67%', top: '41%', width: '14%', height: '11%' } },
  { id: 'hamstrings', label: 'Hamstrings', color: muscleColor.hamstrings, style: { left: '66%', top: '52%', width: '16%', height: '17%' } },
  { id: 'calves', label: 'Calves', color: muscleColor.calves, style: { left: '67%', top: '71%', width: '14%', height: '13%' } },
]

const legend: Muscle[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'core',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
]

export function MuscleMap({ selected, onSelect }: Props) {
  return (
    <div className="anatomy-wrap">
      <div className="anatomy-stage">
        <img
          src={`${import.meta.env.BASE_URL}anatomy-chart.jpg`}
          alt="Musculature anatomy chart — front and back muscle groups"
          className="anatomy-img"
          draggable={false}
        />
        {hotspots.map((h, i) => (
          <button
            key={`${h.id}-${i}`}
            type="button"
            className={`hotspot ${selected === h.id ? 'on' : ''}`}
            style={
              {
                ...h.style,
                '--hs': h.color,
              } as CSSProperties
            }
            aria-label={`Select ${h.label}`}
            title={h.label}
            onClick={() => onSelect(h.id)}
          >
            <span className="hotspot-label">{h.label}</span>
          </button>
        ))}
      </div>

      <div className="anatomy-legend">
        <p className="muted">Tap a colored region on the chart — front (left) or back (right)</p>
        <div className="legend-grid">
          {legend.map((m) => (
            <button
              key={m}
              type="button"
              className={`legend-chip ${selected === m ? 'on' : ''}`}
              style={{ ['--hs' as string]: muscleColor[m] }}
              onClick={() => onSelect(m)}
            >
              <i className="legend-swatch" aria-hidden />
              {muscleLabels[m]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
