/**
 * Build-time importer for yuhonas/free-exercise-db (Unlicense).
 *
 * Downloads exercises.json + exercise images once, normalizes to FORGE schema,
 * writes src/renderer/src/data/exercises.json and resources/exercise-images/.
 *
 * Usage: npm run import:exercises
 * Optional: SKIP_IMAGES=1 to skip image download (JSON only)
 */
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  cpSync,
  rmSync
} from 'fs'
import { join, dirname } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT_JSON = join(ROOT, 'src/renderer/src/data/exercises.json')
const OUT_IMAGES = join(ROOT, 'resources/exercise-images')
const CACHE = join(ROOT, '.cache/free-exercise-db')
const RAW_JSON_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'
const TARBALL_URL = 'https://codeload.github.com/yuhonas/free-exercise-db/tar.gz/refs/heads/main'

type RawExercise = {
  id: string
  name: string
  force: string | null
  level: string
  mechanic: string | null
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  category: string
  images: string[]
}

const MUSCLE_MAP: Record<string, string> = {
  abdominals: 'abs',
  abductors: 'abductors',
  adductors: 'adductors',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  'lower back': 'lower_back',
  'middle back': 'upper_back',
  neck: 'neck',
  quadriceps: 'quads',
  shoulders: 'front_delts',
  traps: 'traps',
  triceps: 'triceps'
}

const EQUIPMENT_MAP: Record<string, string> = {
  barbell: 'barbell',
  dumbbell: 'dumbbell',
  kettlebells: 'kettlebell',
  cable: 'cable',
  machine: 'machine',
  'body only': 'bodyweight',
  bands: 'resistance_band',
  'e-z curl bar': 'ez_bar',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'other',
  'foam roll': 'other',
  other: 'other'
}

function mapMuscle(raw: string, name: string): string | null {
  const key = raw.trim().toLowerCase()
  let mapped = MUSCLE_MAP[key]
  if (!mapped) return null
  if (mapped === 'front_delts') {
    const lower = name.toLowerCase()
    if (/lateral|side raise|side delt|lu raise/.test(lower)) mapped = 'side_delts'
    else if (/rear|reverse fly|face pull|bent.?over.?raise|rear delt/.test(lower))
      mapped = 'rear_delts'
  }
  return mapped
}

function mapEquipment(raw: string | null): string {
  if (!raw) return 'bodyweight'
  return EQUIPMENT_MAP[raw.trim().toLowerCase()] ?? 'other'
}

function mapLevel(level: string): string {
  if (level === 'expert') return 'expert'
  if (level === 'intermediate') return 'intermediate'
  return 'beginner'
}

function mapMechanic(m: string | null): string | null {
  if (m === 'compound' || m === 'isolation') return m
  return null
}

function mapForce(f: string | null): string | null {
  if (f === 'push' || f === 'pull' || f === 'static') return f
  return null
}

async function download(url: string, dest: string): Promise<void> {
  mkdirSync(dirname(dest), { recursive: true })
  if (existsSync(dest)) {
    console.log(`Using cached ${dest}`)
    return
  }
  console.log(`Downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`Failed to download ${url}: ${res.status}`)
  await pipeline(Readable.fromWeb(res.body as never), createWriteStream(dest))
}

function extractImages(tarball: string): void {
  const extractRoot = join(CACHE, 'extract')
  if (existsSync(extractRoot)) rmSync(extractRoot, { recursive: true, force: true })
  mkdirSync(extractRoot, { recursive: true })

  console.log('Extracting exercise images from tarball…')
  execFileSync('tar', ['-xzf', tarball, '-C', extractRoot], { stdio: 'inherit' })

  const top = 'free-exercise-db-main'
  const exercisesDir = join(extractRoot, top, 'exercises')
  if (!existsSync(exercisesDir)) {
    throw new Error('exercises/ folder missing from tarball')
  }

  if (existsSync(OUT_IMAGES)) rmSync(OUT_IMAGES, { recursive: true, force: true })
  mkdirSync(OUT_IMAGES, { recursive: true })

  // Copy only image folders (skip .json sidecars)
  execFileSync(
    'bash',
    [
      '-lc',
      `cd "${exercisesDir}" && find . -type d -mindepth 1 -maxdepth 1 | while read d; do mkdir -p "${OUT_IMAGES}/$d"; cp -n "$d"/*.jpg "$d"/*.jpeg "$d"/*.png "$d"/*.webp "${OUT_IMAGES}/$d/" 2>/dev/null || true; done`
    ],
    { stdio: 'inherit' }
  )

  console.log(`Images → ${OUT_IMAGES}`)
}

async function main(): Promise<void> {
  mkdirSync(CACHE, { recursive: true })
  const rawPath = join(CACHE, 'exercises.raw.json')
  await download(RAW_JSON_URL, rawPath)

  const raw = JSON.parse(readFileSync(rawPath, 'utf8')) as RawExercise[]

  const normalized = raw.map((ex) => {
    const primary = [
      ...new Set(
        ex.primaryMuscles.map((m) => mapMuscle(m, ex.name)).filter((m): m is string => Boolean(m))
      )
    ]
    const secondary = [
      ...new Set(
        ex.secondaryMuscles
          .map((m) => mapMuscle(m, ex.name))
          .filter((m): m is string => Boolean(m))
          .filter((m) => !primary.includes(m))
      )
    ]

    return {
      id: ex.id,
      name: ex.name,
      primaryMuscles: primary,
      secondaryMuscles: secondary,
      equipment: [mapEquipment(ex.equipment)],
      mechanic: mapMechanic(ex.mechanic),
      force: mapForce(ex.force),
      level: mapLevel(ex.level),
      category: ex.category,
      instructions: ex.instructions ?? [],
      images: (ex.images ?? []).map((img) => img.replace(/\\/g, '/')),
      isCustom: false
    }
  })

  mkdirSync(dirname(OUT_JSON), { recursive: true })
  writeFileSync(OUT_JSON, JSON.stringify(normalized))
  console.log(`Wrote ${normalized.length} exercises → ${OUT_JSON}`)

  if (process.env.SKIP_IMAGES === '1') {
    console.log('SKIP_IMAGES=1 — skipping image download')
    return
  }

  const tarball = join(CACHE, 'free-exercise-db.tar.gz')
  // Reuse /tmp copy if present to save bandwidth
  if (!existsSync(tarball) && existsSync('/tmp/fedb/fedb.tar.gz')) {
    mkdirSync(CACHE, { recursive: true })
    cpSync('/tmp/fedb/fedb.tar.gz', tarball)
    console.log('Reused /tmp/fedb/fedb.tar.gz')
  }
  await download(TARBALL_URL, tarball)
  extractImages(tarball)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
