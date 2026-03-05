import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { getSql } from '@/lib/db'
import { getOrCreateTenant, getTenantByUserId } from '@/lib/db-helpers'

type RevenueSettings = {
  defaultRevenuePerBooking?: number
  currency?: string
}

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenant = await getTenantByUserId(session.userId)
  if (!tenant) {
    return NextResponse.json({ settings: {} })
  }

  const sql = getSql()
  const rows = await sql`
    SELECT default_revenue_per_booking, currency
    FROM tenant_settings WHERE tenant_id = ${tenant.id} LIMIT 1`
  const s = (rows as { default_revenue_per_booking: number; currency: string }[])[0]

  const result = s ? {
    defaultRevenuePerBooking: s.default_revenue_per_booking ?? 0,
    currency: s.currency ?? 'USD',
  } : {}

  return NextResponse.json({ settings: result })
}

export async function PUT(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: RevenueSettings
  try {
    body = (await request.json()) as RevenueSettings
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const tenantId = await getOrCreateTenant({
    userId: session.userId,
    email: session.email,
    role: session.role,
    onboardingComplete: session.onboardingComplete,
    allowedModules: session.allowedModules,
  })

  const sql = getSql()
  await sql`
    INSERT INTO tenant_settings (tenant_id, default_revenue_per_booking, currency)
    VALUES (${tenantId}, ${body.defaultRevenuePerBooking ?? 0}, ${body.currency ?? 'USD'})
    ON CONFLICT (tenant_id) DO UPDATE SET
      default_revenue_per_booking = EXCLUDED.default_revenue_per_booking,
      currency = EXCLUDED.currency,
      updated_at = now()`

  return NextResponse.json({ ok: true })
}
