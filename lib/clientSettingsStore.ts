import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export type RevenueSettings = {
  defaultRevenuePerBooking?: number
  currency?: string
}

const store = new Map<string, RevenueSettings>()

function getDataPath(): string {
  return join(process.cwd(), 'data', 'client-settings.json')
}

function loadFromFile(): void {
  try {
    const path = getDataPath()
    if (!existsSync(path)) return
    const raw = readFileSync(path, 'utf-8')
    const obj = JSON.parse(raw) as Record<string, RevenueSettings>
    store.clear()
    for (const [userId, settings] of Object.entries(obj)) {
      if (settings && typeof settings === 'object') store.set(userId, settings)
    }
  } catch {
    // File missing or invalid
  }
}

function saveToFile(): void {
  try {
    const path = getDataPath()
    const dir = join(process.cwd(), 'data')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const obj: Record<string, RevenueSettings> = {}
    Array.from(store.entries()).forEach(([userId, settings]) => {
      obj[userId] = settings
    })
    writeFileSync(path, JSON.stringify(obj, null, 2), 'utf-8')
  } catch {
    // Read-only env
  }
}

loadFromFile()

export function getRevenueSettings(userId: string): RevenueSettings {
  return { ...(store.get(userId) ?? {}) }
}

export function setRevenueSettings(userId: string, settings: RevenueSettings): void {
  const sanitized: RevenueSettings = {}
  if (typeof settings.defaultRevenuePerBooking === 'number' && settings.defaultRevenuePerBooking >= 0) {
    sanitized.defaultRevenuePerBooking = settings.defaultRevenuePerBooking
  }
  if (typeof settings.currency === 'string' && settings.currency.trim()) {
    sanitized.currency = settings.currency.trim()
  }
  store.set(userId, { ...(store.get(userId) ?? {}), ...sanitized })
  saveToFile()
}
