import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth'
import { getUserByEmail, getAllowedModules } from '@/lib/userStore'
import { createSessionCookie, getSessionCookieSpec } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    const user = getUserByEmail(email)
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }
    const allowedModules = getAllowedModules(user)
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
      allowedModules: allowedModules as string[],
    }
    const cookieValue = createSessionCookie(payload)
    const spec = getSessionCookieSpec()
    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role, onboardingComplete: user.onboardingComplete, allowedModules },
    })
    res.cookies.set(spec.name, cookieValue, {
      maxAge: spec.maxAge,
      httpOnly: spec.httpOnly,
      secure: spec.secure,
      sameSite: spec.sameSite,
      path: spec.path,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
