import { db } from '@/db/schema'
import { createDefaultSettings, createDefaultUserProfile, createGymFromPreset } from '@/db/defaults'
import type { AppSettings, GymProfile, UserProfile } from '@/db/types'

export async function ensureDefaults(): Promise<void> {
  const profile = await db.userProfile.get(1)
  if (!profile) {
    await db.userProfile.put(createDefaultUserProfile())
  }

  const settings = await db.appSettings.get(1)
  if (!settings) {
    await db.appSettings.put(createDefaultSettings())
  }

  const gymCount = await db.gymProfiles.count()
  if (gymCount === 0) {
    const commercial = createGymFromPreset('Commercial Gym', true)
    const home = createGymFromPreset('Home Gym', false)
    const bodyweight = createGymFromPreset('Bodyweight Only', false)
    const hotel = createGymFromPreset('Hotel Gym', false)
    await db.gymProfiles.bulkAdd([commercial, home, bodyweight, hotel])
  }
}

export async function getUserProfile(): Promise<UserProfile> {
  await ensureDefaults()
  const profile = await db.userProfile.get(1)
  if (!profile) throw new Error('User profile missing')
  return profile
}

export async function updateUserProfile(
  patch: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<UserProfile> {
  const current = await getUserProfile()
  const next: UserProfile = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  }
  await db.userProfile.put(next)
  return next
}

export async function getAppSettings(): Promise<AppSettings> {
  await ensureDefaults()
  const settings = await db.appSettings.get(1)
  if (!settings) throw new Error('App settings missing')
  return settings
}

export async function updateAppSettings(
  patch: Partial<Omit<AppSettings, 'id'>>
): Promise<AppSettings> {
  const current = await getAppSettings()
  const next = { ...current, ...patch }
  await db.appSettings.put(next)
  return next
}

export async function listGymProfiles(): Promise<GymProfile[]> {
  await ensureDefaults()
  return db.gymProfiles.orderBy('name').toArray()
}

export async function getActiveGymProfile(): Promise<GymProfile> {
  await ensureDefaults()
  const active = await db.gymProfiles.filter((g) => g.isActive).first()
  if (active) return active
  const first = await db.gymProfiles.toCollection().first()
  if (!first) throw new Error('No gym profiles')
  await setActiveGymProfile(first.id)
  return { ...first, isActive: true }
}

export async function setActiveGymProfile(id: string): Promise<void> {
  await db.transaction('rw', db.gymProfiles, async () => {
    const all = await db.gymProfiles.toArray()
    await Promise.all(all.map((g) => db.gymProfiles.put({ ...g, isActive: g.id === id })))
  })
}

export async function upsertGymProfile(profile: GymProfile): Promise<void> {
  await db.gymProfiles.put(profile)
}

export async function deleteGymProfile(id: string): Promise<void> {
  const all = await db.gymProfiles.toArray()
  if (all.length <= 1) throw new Error('Cannot delete the last gym profile')
  const target = all.find((g) => g.id === id)
  await db.gymProfiles.delete(id)
  if (target?.isActive) {
    const remaining = all.filter((g) => g.id !== id)
    await setActiveGymProfile(remaining[0].id)
  }
}
