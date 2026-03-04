import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

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
    return NextResponse.json({ keys: {} })
  }

  const { data: credentials } = await supabase
    .from('tenant_credentials')
    .select('*')
    .eq('tenant_id', tenant.id)
    .maybeSingle()

  const keys = credentials ? {
    twilioAccountSid: credentials.twilio_account_sid || '',
    twilioAuthToken: credentials.twilio_auth_token || '',
    vapiApiKey: credentials.vapi_api_key || '',
    crmEndpoint: credentials.crm_endpoint || '',
    webhookSecret: credentials.webhook_secret || '',
  } : {}

  return NextResponse.json({ keys })
}

export async function PUT(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
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
    .from('tenant_credentials')
    .upsert({
      tenant_id: tenantId,
      twilio_account_sid: body.twilioAccountSid || null,
      twilio_auth_token: body.twilioAuthToken || null,
      vapi_api_key: body.vapiApiKey || null,
      crm_endpoint: body.crmEndpoint || null,
      webhook_secret: body.webhookSecret || null,
    }, {
      onConflict: 'tenant_id'
    })

  if (error) {
    console.error('Failed to save credentials:', error)
    return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
