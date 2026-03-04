import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenantId,
      appointmentId,
      contactPhone,
      contactEmail,
      contactName,
      value,
      bookedAt,
      callSid,
      status = 'confirmed'
    } = body

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 })
    }

    const supabase = createServerClient()

    let callId = null
    if (callSid) {
      const { data: call } = await supabase
        .from('calls')
        .select('id')
        .eq('call_sid', callSid)
        .eq('tenant_id', tenantId)
        .maybeSingle()

      if (call) callId = call.id
    }

    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('default_revenue_per_booking')
      .eq('tenant_id', tenantId)
      .maybeSingle()

    const valueCents = value ? Math.round(value * 100) : (settings?.default_revenue_per_booking || 0)

    const { error } = await supabase
      .from('bookings')
      .insert({
        tenant_id: tenantId,
        call_id: callId,
        external_id: appointmentId,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        contact_name: contactName,
        value_cents: valueCents,
        booked_at: bookedAt ? new Date(bookedAt).toISOString() : new Date().toISOString(),
        status,
        metadata: body
      })

    if (error) {
      console.error('Make.com webhook error:', error)
      return NextResponse.json({ error: 'Failed to store booking' }, { status: 500 })
    }

    if (callId) {
      await supabase
        .from('conversations')
        .update({ revenue_cents: valueCents })
        .eq('call_id', callId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Make.com webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
