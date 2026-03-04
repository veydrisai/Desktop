import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { getUserById } from '@/lib/userStore'
import { getRevenueSettings, setRevenueSettings, type RevenueSettings } from '@/lib/clientSettingsStore'

type RouteParams = { clientId: string }

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
  const settings = getRevenueSettings(clientId)
  return NextResponse.json({ settings })
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
  setRevenueSettings(clientId, body)
  return NextResponse.json({ ok: true })
}
