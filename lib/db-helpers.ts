import { getSql } from '@/lib/db'

export type TenantRow = {
  id: string
  user_id: string
  email: string
  role: string
  onboarding_complete: boolean
  allowed_modules: string[] | null
}

export async function getTenantByUserId(userId: string): Promise<TenantRow | null> {
  const sql = getSql()
  const rows = await sql`SELECT id, user_id, email, role, onboarding_complete, allowed_modules
    FROM tenants WHERE user_id = ${userId} LIMIT 1`
  return (rows as TenantRow[])[0] ?? null
}

export async function getOrCreateTenant(params: {
  userId: string
  email: string
  role: string
  onboardingComplete: boolean
  allowedModules?: string[]
}): Promise<string> {
  const sql = getSql()
  const existing = await getTenantByUserId(params.userId)
  if (existing) return existing.id

  const modules = params.allowedModules ?? ['performance', 'analytics', 'system']
  const rows = await sql`
    INSERT INTO tenants (user_id, email, role, onboarding_complete, allowed_modules)
    VALUES (${params.userId}, ${params.email}, ${params.role}, ${params.onboardingComplete}, ${modules})
    RETURNING id`
  const row = (rows as { id: string }[])[0]
  if (!row) throw new Error('Failed to create tenant')
  return row.id
}
