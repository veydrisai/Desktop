import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { callId, call, message } = body

    if (message?.type !== 'end-of-call-report') {
      return NextResponse.json({ success: true, skipped: true })
    }

    const callSid = call?.metadata?.twilioCallSid || callId
    const intent = message?.analysis?.intent || 'unknown'
    const outcome = message?.analysis?.outcome || message?.endedReason || 'unknown'
    const duration = call?.duration || 0

    if (!callSid) {
      return NextResponse.json({ error: 'Missing call identifier' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: existingCall } = await supabase
      .from('calls')
      .select('id, tenant_id')
      .eq('call_sid', callSid)
      .maybeSingle()

    if (!existingCall) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('conversations')
      .insert({
        tenant_id: existingCall.tenant_id,
        call_id: existingCall.id,
        external_id: callId,
        intent,
        outcome,
        duration_sec: duration,
        revenue_cents: 0,
        metadata: body
      })

    if (error) {
      console.error('Vapi webhook error:', error)
      return NextResponse.json({ error: 'Failed to store conversation' }, { status: 500 })
    }

    return NextResponse.json({ success: true, callId })
  } catch (error) {
    console.error('Vapi webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
