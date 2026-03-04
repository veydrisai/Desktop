import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export type ApiKeysConfig = {
  twilioAccountSid?: string
  twilioAuthToken?: string
  crmEndpoint?: string
  webhookSecret?: string
  [key: string]: string | undefined
}

const store = new Map<string, ApiKeysConfig>()

function getDataPath(): string {
  return join(process.cwd(), 'data', 'api-keys.json')
}

function loadFromFile(): void {
  try {
    const path = getDataPath()
    if (!existsSync(path)) return
    const raw = readFileSync(path, 'utf-8')
    const obj = JSON.parse(raw) as Record<string, ApiKeysConfig>
    store.clear()
    for (const [userId, keys] of Object.entries(obj)) {
      if (keys && typeof keys === 'object') store.set(userId, keys)
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
    const obj: Record<string, ApiKeysConfig> = {}
    Array.from(store.entries()).forEach(([userId, keys]) => {
      obj[userId] = keys
    })
    writeFileSync(path, JSON.stringify(obj, null, 2), 'utf-8')
  } catch {
    // Read-only env
  }
}

loadFromFile()

export function getApiKeys(userId: string): ApiKeysConfig {
  return { ...(store.get(userId) ?? {}) }
}

export function setApiKeys(userId: string, keys: ApiKeysConfig): void {
  store.set(userId, { ...keys })
  saveToFile()
}
