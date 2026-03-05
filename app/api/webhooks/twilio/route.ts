import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const callSid = body.get('CallSid') as string
    const from = body.get('From') as string
    const to = body.get('To') as string
    const duration = body.get('CallDuration') as string
    const status = body.get('CallStatus') as string
    const accountSid = body.get('AccountSid') as string

    if (!callSid || !accountSid) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sql = getSql()
    const credRows = await sql`
      SELECT tenant_id FROM tenant_credentials
      WHERE twilio_account_sid = ${accountSid} LIMIT 1`
    const cred = (credRows as { tenant_id: string }[])[0]
    if (!cred) {
      return NextResponse.json({ error: 'Tenant not found for Account SID' }, { status: 404 })
    }

    const durationSec = duration ? parseInt(duration, 10) : 0
    await sql`
      INSERT INTO calls (tenant_id, call_sid, from_number, to_number, duration_sec, status)
      VALUES (${cred.tenant_id}, ${callSid}, ${from ?? null}, ${to ?? null}, ${durationSec}, ${status || 'completed'})
      ON CONFLICT (call_sid) DO UPDATE SET
        from_number = EXCLUDED.from_number,
        to_number = EXCLUDED.to_number,
        duration_sec = EXCLUDED.duration_sec,
        status = EXCLUDED.status,
        updated_at = now()`

    return NextResponse.json({ success: true, callSid })
  } catch (error) {
    console.error('Twilio webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
