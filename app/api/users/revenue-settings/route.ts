import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

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

  const supabase = createServerClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle()

  if (!tenant) {
    return NextResponse.json({ settings: {} })
  }

  const { data: settings } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('tenant_id', tenant.id)
    .maybeSingle()

  const result = settings ? {
    defaultRevenuePerBooking: settings.default_revenue_per_booking || 0,
    currency: settings.currency || 'USD',
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

  const supabase = createServerClient()

  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', session.userId)
    .maybeSingle()

  let tenantId: string

  if (!existingTenant) {
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        user_id: session.userId,
        email: session.email,
        role: session.role,
        onboarding_complete: session.onboardingComplete,
        allowed_modules: session.allowedModules || ['performance', 'analytics', 'system']
      })
      .select('id')
      .single()

    if (tenantError || !newTenant) {
      return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
    }
    tenantId = newTenant.id
  } else {
    tenantId = existingTenant.id
  }

  const { error } = await supabase
    .from('tenant_settings')
    .upsert({
      tenant_id: tenantId,
      default_revenue_per_booking: body.defaultRevenuePerBooking || 0,
      currency: body.currency || 'USD',
    }, {
      onConflict: 'tenant_id'
    })

  if (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
