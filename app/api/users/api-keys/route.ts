import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { getApiKeys, setApiKeys, type ApiKeysConfig } from '@/lib/apiKeysStore'

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const keys = getApiKeys(session.userId)
  return NextResponse.json({ keys })
}

export async function PUT(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json() as ApiKeysConfig
  setApiKeys(session.userId, body)
  return NextResponse.json({ ok: true })
}
