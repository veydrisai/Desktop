import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/sessionCookie'

const protectedPaths = ['/dashboard', '/admin', '/onboarding', '/settings']

function isProtected(pathname: string): boolean {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
  const hasSession = !!sessionCookie && sessionCookie.length > 10

  if (isProtected(request.nextUrl.pathname) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (request.nextUrl.pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*', '/admin', '/admin/:path*', '/onboarding', '/onboarding/:path*', '/settings', '/settings/:path*', '/login'],
}
