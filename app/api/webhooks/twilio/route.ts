import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

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

    const supabase = createServerClient()

    const { data: credentials } = await supabase
      .from('tenant_credentials')
      .select('tenant_id')
      .eq('twilio_account_sid', accountSid)
      .maybeSingle()

    if (!credentials) {
      return NextResponse.json({ error: 'Tenant not found for Account SID' }, { status: 404 })
    }

    const { error } = await supabase
      .from('calls')
      .upsert({
        tenant_id: credentials.tenant_id,
        call_sid: callSid,
        from_number: from,
        to_number: to,
        duration_sec: duration ? parseInt(duration, 10) : 0,
        status: status || 'completed',
      }, {
        onConflict: 'call_sid'
      })

    if (error) {
      console.error('Twilio webhook error:', error)
      return NextResponse.json({ error: 'Failed to store call' }, { status: 500 })
    }

    return NextResponse.json({ success: true, callSid })
  } catch (error) {
    console.error('Twilio webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
