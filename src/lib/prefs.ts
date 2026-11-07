import type { Equipment, Muscle } from '../data/exercises'

const EQUIP_KEY = 'repwise.equipment'
const MUSCLE_KEY = 'repwise.muscles'

export function getEquipment(): Equipment[] {
  try {
    const raw = JSON.parse(localStorage.getItem(EQUIP_KEY) || '[]') as Equipment[]
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function setEquipment(list: Equipment[]) {
  localStorage.setItem(EQUIP_KEY, JSON.stringify(list))
}

export function getMuscles(): Muscle[] {
  try {
    const raw = JSON.parse(localStorage.getItem(MUSCLE_KEY) || '[]') as Muscle[]
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function setMuscles(list: Muscle[]) {
  localStorage.setItem(MUSCLE_KEY, JSON.stringify(list))
}
