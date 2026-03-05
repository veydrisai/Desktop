import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { getUserById } from '@/lib/userStore'
import { getSql } from '@/lib/db'
import { getTenantByUserId } from '@/lib/db-helpers'

type RouteParams = { clientId: string; id: string }

async function resolveParams(params: RouteParams | Promise<RouteParams>): Promise<RouteParams> {
  return typeof (params as Promise<RouteParams>).then === 'function'
    ? await (params as Promise<RouteParams>)
    : (params as RouteParams)
}

export async function PATCH(
  request: NextRequest,
  context: { params: RouteParams | Promise<RouteParams> }
) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clientId, id } = await resolveParams(context.params)
  const user = getUserById(clientId)
  if (!user) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const tenant = await getTenantByUserId(clientId)
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  let body: { intent?: string; outcome?: string; revenue?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sql = getSql()

  // Verify the conversation belongs to this tenant
  const check = await sql`
    SELECT id FROM conversations WHERE id = ${id} AND tenant_id = ${tenant.id} LIMIT 1`
  if ((check as { id: string }[]).length === 0) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  if (body.intent !== undefined) {
    await sql`UPDATE conversations SET intent = ${body.intent}, updated_at = now() WHERE id = ${id}`
  }
  if (body.outcome !== undefined) {
    await sql`UPDATE conversations SET outcome = ${body.outcome}, updated_at = now() WHERE id = ${id}`
  }
  if (body.revenue !== undefined && !isNaN(body.revenue) && body.revenue >= 0) {
    await sql`UPDATE conversations SET revenue_cents = ${Math.round(body.revenue * 100)}, updated_at = now() WHERE id = ${id}`
  }

  return NextResponse.json({ ok: true })
}
