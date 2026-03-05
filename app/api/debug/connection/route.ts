import { NextRequest, NextResponse } from 'next/server'
import { parseSessionCookie, SESSION_COOKIE } from '@/lib/auth'
import { getSql } from '@/lib/db'
import { getTenantByUserId } from '@/lib/db-helpers'

/**
 * GET /api/debug/connection
 * Returns connection diagnostics (no secrets). Requires valid session.
 * In production, only enabled when DEBUG=1 to avoid leaking status.
 */
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'
  const debugEnv = process.env.DEBUG === '1' || process.env.DEBUG === 'true'
  if (!isDev && !debugEnv) {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value
  const session = parseSessionCookie(cookie)
  const hasSession = !!session

  let hasTenant = false
  let hasVapiKey = false
  let dbOk = false
  let hint = ''

  if (!hasSession) {
    hint = 'not_logged_in'
    return NextResponse.json({
      hasSession: false,
      hasTenant: false,
      hasVapiKey: false,
      dbOk: false,
      hint,
    })
  }

  try {
    const sql = getSql()
    dbOk = true
    await sql`SELECT 1`
  } catch {
    hint = 'db_error'
    return NextResponse.json({
      hasSession: true,
      hasTenant: false,
      hasVapiKey: false,
      dbOk: false,
      hint,
    })
  }

  const tenant = await getTenantByUserId(session!.userId)
  hasTenant = !!tenant

  if (tenant) {
    const sql = getSql()
    const rows = await sql`
      SELECT (vapi_api_key IS NOT NULL AND trim(vapi_api_key) != '') AS has_key
      FROM tenant_credentials WHERE tenant_id = ${tenant.id} LIMIT 1`
    const row = (rows as { has_key: boolean }[])[0]
    hasVapiKey = !!row?.has_key
    if (!hasVapiKey) hint = 'missing_vapi_key'
  } else {
    hint = 'no_tenant'
  }

  return NextResponse.json({
    hasSession: true,
    hasTenant,
    hasVapiKey,
    dbOk: true,
    hint: hint || (hasVapiKey ? 'ok' : 'missing_vapi_key'),
  })
}
