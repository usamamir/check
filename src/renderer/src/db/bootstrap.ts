import { ensureDefaults } from '@/db/repositories/profile'
import { seedBundledExercises } from '@/db/repositories/exercises'
import { db } from '@/db/schema'

let bootPromise: Promise<void> | null = null

export async function bootstrapDb(): Promise<void> {
  if (!bootPromise) {
    bootPromise = (async () => {
      // Touch Dexie so migrations run
      await db.open()
      await ensureDefaults()
      const seeded = await seedBundledExercises()
      console.info(`[forge] db ready — ${seeded} bundled exercises`)
    })().catch((err) => {
      bootPromise = null
      throw err
    })
  }
  return bootPromise
}
