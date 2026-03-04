import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { getUserById } from '@/lib/userStore'
import { createServerClient } from '@/lib/supabase'

type RouteParams = { clientId: string }
type RevenueSettings = {
  defaultRevenuePerBooking?: number
  currency?: string
}

async function getClientId(params: RouteParams | Promise<RouteParams>): Promise<string | null> {
  const resolved: RouteParams =
    typeof (params as Promise<RouteParams>).then === 'function'
      ? await (params as Promise<RouteParams>)
      : (params as RouteParams)
  return resolved?.clientId ?? null
}

export async function GET(
  request: NextRequest,
  context: { params: RouteParams | Promise<RouteParams> }
) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const clientId = await getClientId(context.params)
  if (!clientId) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const user = getUserById(clientId)
  if (!user || user.role !== 'client') {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const supabase = createServerClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('user_id', clientId)
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

export async function PUT(
  request: NextRequest,
  context: { params: RouteParams | Promise<RouteParams> }
) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const clientId = await getClientId(context.params)
  if (!clientId) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const user = getUserById(clientId)
  if (!user || user.role !== 'client') {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
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
    .eq('user_id', clientId)
    .maybeSingle()

  let tenantId: string

  if (!existingTenant) {
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        user_id: clientId,
        email: user.email,
        role: user.role,
        onboarding_complete: user.onboardingComplete,
        allowed_modules: user.allowedModules || ['performance', 'analytics', 'system']
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
