import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { getSql } from '@/lib/db'
import { getTenantByUserId } from '@/lib/db-helpers'

type RouteParams = { id: string }

async function getId(params: RouteParams | Promise<RouteParams>): Promise<string | null> {
  const resolved = typeof (params as Promise<RouteParams>).then === 'function'
    ? await (params as Promise<RouteParams>)
    : (params as RouteParams)
  return resolved?.id ?? null
}

export async function PATCH(
  request: NextRequest,
  context: { params: RouteParams | Promise<RouteParams> }
) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversationId = await getId(context.params)
  if (!conversationId) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const tenant = await getTenantByUserId(session.userId)
  if (!tenant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { intent?: string; outcome?: string; revenue?: number }
  try {
    body = (await request.json()) as { intent?: string; outcome?: string; revenue?: number }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sql = getSql()
  const revenueCents = body.revenue != null ? Math.round(body.revenue * 100) : undefined

  if (body.intent !== undefined) {
    await sql`UPDATE conversations SET intent = ${body.intent}, updated_at = now() WHERE tenant_id = ${tenant.id} AND id = ${conversationId}`
  }
  if (body.outcome !== undefined) {
    await sql`UPDATE conversations SET outcome = ${body.outcome}, updated_at = now() WHERE tenant_id = ${tenant.id} AND id = ${conversationId}`
  }
  if (revenueCents !== undefined) {
    await sql`UPDATE conversations SET revenue_cents = ${revenueCents}, updated_at = now() WHERE tenant_id = ${tenant.id} AND id = ${conversationId}`
  }

  return NextResponse.json({ ok: true })
}
