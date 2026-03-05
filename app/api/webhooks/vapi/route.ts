import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (message?.type !== 'end-of-call-report') {
      return NextResponse.json({ success: true, skipped: true })
    }

    // Vapi puts call data inside message.call, not at the top level
    const call = message?.call
    const callId = call?.id
    const callSid = call?.metadata?.twilioCallSid || callId
    const intent = message?.analysis?.intent || 'unknown'
    const outcome = message?.analysis?.outcome || message?.endedReason || 'unknown'
    const duration = call?.duration || 0

    if (!callSid) {
      return NextResponse.json({ error: 'Missing call identifier' }, { status: 400 })
    }

    const sql = getSql()
    const callRows = await sql`
      SELECT id, tenant_id FROM calls WHERE call_sid = ${callSid} LIMIT 1`
    const existingCall = (callRows as { id: string; tenant_id: string }[])[0]
    if (!existingCall) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    await sql`
      INSERT INTO conversations (tenant_id, call_id, external_id, intent, outcome, duration_sec, revenue_cents, metadata)
      VALUES (${existingCall.tenant_id}, ${existingCall.id}, ${callId}, ${intent}, ${outcome}, ${duration}, 0, ${JSON.stringify(body)}::jsonb)`

    return NextResponse.json({ success: true, callId })
  } catch (error) {
    console.error('Vapi webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
