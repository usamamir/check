export type UserProfile = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
  onboardingDone: boolean
  goal: 'strength' | 'hypertrophy' | 'general' | null
  level: 'beginner' | 'intermediate' | 'advanced' | null
  equipment: string[]
  daysPerWeek: number
}

const USERS_KEY = 'repwise.users'
const SESSION_KEY = 'repwise.session'

async function sha256(text: string) {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function readUsers(): UserProfile[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as UserProfile[]
  } catch {
    return []
  }
}

function writeUsers(users: UserProfile[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getSessionEmail(): string | null {
  return localStorage.getItem(SESSION_KEY)
}

export function getCurrentUser(): UserProfile | null {
  const email = getSessionEmail()
  if (!email) return null
  return readUsers().find((u) => u.email === email) ?? null
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export async function signup(input: {
  name: string
  email: string
  password: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase()
  if (!input.name.trim()) return { ok: false, error: 'Name is required.' }
  if (!email.includes('@')) return { ok: false, error: 'Enter a valid email.' }
  if (input.password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }

  const users = readUsers()
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: 'An account with that email already exists.' }
  }

  const passwordHash = await sha256(`${email}:${input.password}`)
  const user: UserProfile = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
    onboardingDone: false,
    goal: null,
    level: null,
    equipment: ['barbell', 'dumbbell', 'bodyweight'],
    daysPerWeek: 3,
  }
  users.push(user)
  writeUsers(users)
  localStorage.setItem(SESSION_KEY, email)
  return { ok: true }
}

export async function login(input: {
  email: string
  password: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase()
  const users = readUsers()
  const user = users.find((u) => u.email === email)
  if (!user) return { ok: false, error: 'No account found for that email.' }
  const passwordHash = await sha256(`${email}:${input.password}`)
  if (passwordHash !== user.passwordHash) return { ok: false, error: 'Incorrect password.' }
  localStorage.setItem(SESSION_KEY, email)
  return { ok: true }
}

export function updateCurrentUser(patch: Partial<UserProfile>) {
  const email = getSessionEmail()
  if (!email) return null
  const users = readUsers()
  const idx = users.findIndex((u) => u.email === email)
  if (idx < 0) return null
  users[idx] = { ...users[idx], ...patch, email: users[idx].email, id: users[idx].id }
  writeUsers(users)
  return users[idx]
}
