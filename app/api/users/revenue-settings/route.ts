import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { getRevenueSettings, setRevenueSettings, type RevenueSettings } from '@/lib/clientSettingsStore'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const settings = getRevenueSettings(session.userId)
  return NextResponse.json({ settings })
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
  setRevenueSettings(session.userId, body)
  return NextResponse.json({ ok: true })
}
