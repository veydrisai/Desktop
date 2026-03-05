import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/db'

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

    const sql = getSql()
    let callId: string | null = null
    if (callSid) {
      const callRows = await sql`
        SELECT id FROM calls WHERE call_sid = ${callSid} AND tenant_id = ${tenantId} LIMIT 1`
      const call = (callRows as { id: string }[])[0]
      if (call) callId = call.id
    }

    const settingsRows = await sql`
      SELECT default_revenue_per_booking FROM tenant_settings WHERE tenant_id = ${tenantId} LIMIT 1`
    const settings = (settingsRows as { default_revenue_per_booking: number | null }[])[0]
    const valueCents = value != null ? Math.round(Number(value) * 100) : (settings?.default_revenue_per_booking ?? 0)

    const bookedAtVal = bookedAt ? new Date(bookedAt).toISOString() : new Date().toISOString()
    await sql`
      INSERT INTO bookings (tenant_id, call_id, external_id, contact_phone, contact_email, contact_name, value_cents, booked_at, status, metadata)
      VALUES (${tenantId}, ${callId}, ${appointmentId ?? null}, ${contactPhone ?? null}, ${contactEmail ?? null}, ${contactName ?? null}, ${valueCents}, ${bookedAtVal}, ${status}, ${JSON.stringify(body)}::jsonb)`

    if (callId) {
      await sql`
        UPDATE conversations SET revenue_cents = ${valueCents}, updated_at = now()
        WHERE call_id = ${callId}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Make.com webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
