export type Muscle =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'core'
  | 'calves'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'

export type Exercise = {
  id: string
  name: string
  muscles: Muscle[]
  equipment: Equipment[]
  level: 'beginner' | 'intermediate' | 'advanced'
  youtubeId: string
  cues: string[]
}

/** Curated demos — YouTube IDs verified via oEmbed */
export const exercises: Exercise[] = [
  {
    id: 'barbell-back-squat',
    name: 'Barbell Back Squat',
    muscles: ['quads', 'glutes', 'hamstrings', 'core'],
    equipment: ['barbell'],
    level: 'intermediate',
    youtubeId: 'ultWZbUMPL8',
    cues: ['Brace your core', 'Sit hips back', 'Drive through mid-foot'],
  },
  {
    id: 'conventional-deadlift',
    name: 'Conventional Deadlift',
    muscles: ['hamstrings', 'glutes', 'back', 'core'],
    equipment: ['barbell'],
    level: 'intermediate',
    youtubeId: 'op9kVnSso6Q',
    cues: ['Bar over mid-foot', 'Pull slack out', 'Push floor away'],
  },
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell'],
    level: 'intermediate',
    youtubeId: 'rT7DgCr-3pg',
    cues: ['Retract scapula', 'Soft arch', 'Lower with control'],
  },
  {
    id: 'overhead-press',
    name: 'Standing Overhead Press',
    muscles: ['shoulders', 'triceps', 'core'],
    equipment: ['barbell'],
    level: 'intermediate',
    youtubeId: '2yjwXTZQDDI',
    cues: ['Glutes tight', 'Bar path vertical', 'Lock out overhead'],
  },
  {
    id: 'barbell-row',
    name: 'Barbell Bent-Over Row',
    muscles: ['back', 'biceps'],
    equipment: ['barbell'],
    level: 'intermediate',
    youtubeId: 'FWJR5Ve8bnQ',
    cues: ['Hinge at hips', 'Pull to lower ribs', 'Squeeze lats'],
  },
  {
    id: 'hip-thrust',
    name: 'Barbell Hip Thrust',
    muscles: ['glutes', 'hamstrings'],
    equipment: ['barbell'],
    level: 'intermediate',
    youtubeId: 'ppObwrM84HY',
    cues: ['Chin tucked', 'Drive through heels', 'Squeeze glutes hard'],
  },
  {
    id: 'dumbbell-incline-press',
    name: 'Dumbbell Incline Press',
    muscles: ['chest', 'shoulders', 'triceps'],
    equipment: ['dumbbell'],
    level: 'beginner',
    youtubeId: 'oZVCBM9f8Eo',
    cues: ['30–45° bench', 'Wrists stacked', 'Soft lockout'],
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Chest Fly',
    muscles: ['chest'],
    equipment: ['dumbbell'],
    level: 'beginner',
    youtubeId: 'eozdVDA78K0',
    cues: ['Slight elbow bend', 'Wide arc', 'Squeeze at top'],
  },
  {
    id: 'dumbbell-rdl',
    name: 'Dumbbell Romanian Deadlift',
    muscles: ['hamstrings', 'glutes', 'back'],
    equipment: ['dumbbell'],
    level: 'beginner',
    youtubeId: 'jEy_czb3RKA',
    cues: ['Soft knees', 'Push hips back', 'Feel hamstrings load'],
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    muscles: ['quads', 'glutes', 'hamstrings'],
    equipment: ['dumbbell', 'bodyweight'],
    level: 'beginner',
    youtubeId: 'L8fvypPrzzs',
    cues: ['Long step', 'Front knee tracks toes', 'Tall torso'],
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    muscles: ['shoulders', 'triceps'],
    equipment: ['dumbbell'],
    level: 'beginner',
    youtubeId: 'M2rwvNhTOu0',
    cues: ['Ribs down', 'Press up and slightly in', 'Control bottom'],
  },
  {
    id: 'lateral-raise',
    name: 'Dumbbell Lateral Raise',
    muscles: ['shoulders'],
    equipment: ['dumbbell'],
    level: 'beginner',
    youtubeId: '3VcKaXpzqRo',
    cues: ['Slight elbow bend', 'Lead with elbows', 'Stop at shoulder height'],
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Biceps Curl',
    muscles: ['biceps'],
    equipment: ['dumbbell'],
    level: 'beginner',
    youtubeId: 'ykJmrZ5v0Oo',
    cues: ['Elbows pinned', 'Squeeze at top', 'No swing'],
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    muscles: ['quads', 'glutes'],
    equipment: ['dumbbell', 'bodyweight'],
    level: 'intermediate',
    youtubeId: '2C-uNgKwPLE',
    cues: ['Front shin vertical', 'Torso slight lean', 'Control knee'],
  },
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    muscles: ['quads', 'glutes', 'core'],
    equipment: ['dumbbell', 'kettlebell'],
    level: 'beginner',
    youtubeId: 'MxsFDhcyFyE',
    cues: ['Elbows inside knees', 'Chest tall', 'Sit between heels'],
  },
  {
    id: 'farmer-carry',
    name: 'Farmer Carry',
    muscles: ['core', 'shoulders', 'back'],
    equipment: ['dumbbell', 'kettlebell'],
    level: 'beginner',
    youtubeId: 'Fkzk_RqlYig',
    cues: ['Tall posture', 'Crush grips', 'Short steps'],
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscles: ['back', 'biceps'],
    equipment: ['cable', 'machine'],
    level: 'beginner',
    youtubeId: 'CAwf7n6Luuc',
    cues: ['Lean slightly back', 'Pull elbows down', 'Pause at chest'],
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    muscles: ['back', 'biceps'],
    equipment: ['cable'],
    level: 'beginner',
    youtubeId: 'GZbfZ033f74',
    cues: ['Neutral spine', 'Pull to stomach', 'No momentum'],
  },
  {
    id: 'tricep-pushdown',
    name: 'Cable Triceps Pushdown',
    muscles: ['triceps'],
    equipment: ['cable'],
    level: 'beginner',
    youtubeId: '2-LAMcpzODU',
    cues: ['Elbows fixed', 'Full extension', 'Control return'],
  },
  {
    id: 'face-pull',
    name: 'Cable Face Pull',
    muscles: ['shoulders', 'back'],
    equipment: ['cable', 'band'],
    level: 'beginner',
    youtubeId: '0Po47vvj9g4',
    cues: ['Pull to face', 'External rotate', 'Squeeze rear delts'],
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscles: ['quads', 'glutes'],
    equipment: ['machine'],
    level: 'beginner',
    youtubeId: 'IZxyjW7MPJQ',
    cues: ['Feet mid-platform', 'Don’t lock knees hard', 'Full controlled ROM'],
  },
  {
    id: 'leg-curl',
    name: 'Lying Leg Curl',
    muscles: ['hamstrings'],
    equipment: ['machine'],
    level: 'beginner',
    youtubeId: '1Tq3QdYUuHs',
    cues: ['Hips glued down', 'Curl fully', 'Slow eccentric'],
  },
  {
    id: 'calf-raise',
    name: 'Standing Calf Raise',
    muscles: ['calves'],
    equipment: ['machine', 'bodyweight'],
    level: 'beginner',
    youtubeId: 'gwLzBJYoWlI',
    cues: ['Full stretch', 'Pause at top', 'No bouncing'],
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    muscles: ['back', 'biceps'],
    equipment: ['bodyweight'],
    level: 'intermediate',
    youtubeId: 'eGo4IYlbE5g',
    cues: ['Full hang', 'Chest to bar', 'Control the descent'],
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    muscles: ['chest', 'triceps', 'shoulders', 'core'],
    equipment: ['bodyweight'],
    level: 'beginner',
    youtubeId: 'Eh00_rniF8E',
    cues: ['Body in one line', 'Elbows ~45°', 'Chest near floor'],
  },
  {
    id: 'dip',
    name: 'Parallel Bar Dip',
    muscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['bodyweight'],
    level: 'intermediate',
    youtubeId: '2z8JmcrW-As',
    cues: ['Slight lean', 'Shoulders down', 'Don’t bounce bottom'],
  },
  {
    id: 'plank',
    name: 'Front Plank',
    muscles: ['core'],
    equipment: ['bodyweight'],
    level: 'beginner',
    youtubeId: 'ASdvN_XEl_c',
    cues: ['Ribs down', 'Glutes on', 'Breathe steadily'],
  },
  {
    id: 'hanging-knee-raise',
    name: 'Hanging Knee Raise',
    muscles: ['core'],
    equipment: ['bodyweight'],
    level: 'intermediate',
    youtubeId: 'MRcpnl4G3YA',
    cues: ['Posterior pelvic tilt', 'No swing', 'Control lowering'],
  },
  {
    id: 'kettlebell-swing',
    name: 'Kettlebell Swing',
    muscles: ['glutes', 'hamstrings', 'core'],
    equipment: ['kettlebell'],
    level: 'intermediate',
    youtubeId: 'YSxHifyI6s8',
    cues: ['Hinge not squat', 'Snap hips', 'Arms relaxed'],
  },
  {
    id: 'band-pull-apart',
    name: 'Band Pull-Apart',
    muscles: ['shoulders', 'back'],
    equipment: ['band'],
    level: 'beginner',
    youtubeId: 'qi2y-eI_kuI',
    cues: ['Arms long', 'Squeeze shoulder blades', 'Slow tempo'],
  },
]

export const muscleLabels: Record<Muscle, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  core: 'Core',
  calves: 'Calves',
}

export const equipmentLabels: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell',
  band: 'Band',
}

export const allEquipment = Object.keys(equipmentLabels) as Equipment[]
export const allMuscles = Object.keys(muscleLabels) as Muscle[]

export function getExercise(id: string) {
  return exercises.find((e) => e.id === id)
}

export function filterExercises(opts: {
  equipment: Equipment[]
  muscles: Muscle[]
  query?: string
}) {
  const eq = new Set(opts.equipment)
  const ms = new Set(opts.muscles)
  const q = (opts.query || '').trim().toLowerCase()
  return exercises.filter((ex) => {
    const equipOk = ex.equipment.some((e) => eq.has(e))
    const muscleOk = ms.size === 0 || ex.muscles.some((m) => ms.has(m))
    const textOk = !q || ex.name.toLowerCase().includes(q)
    return equipOk && muscleOk && textOk
  })
}
