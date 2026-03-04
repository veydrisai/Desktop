'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export type Session = {
  userId: string
  email: string
  role: 'admin' | 'client'
  onboardingComplete: boolean
  allowedModules?: string[]
}

type SessionContextValue = {
  session: Session | null
  isLoading: boolean
  isLoggingOut: boolean
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' })
      const data = await res.json()
      setSession(data.session ?? null)
    } catch {
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const logout = useCallback(async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      setSession(null)
      router.push('/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }, [router, loggingOut])

  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    await fetchSession()
  }, [fetchSession])

  const value: SessionContextValue = {
    session,
    isLoading,
    isLoggingOut: loggingOut,
    logout,
    refreshSession,
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    return {
      session: null,
      isLoading: true,
      isLoggingOut: false,
      logout: async () => {},
      refreshSession: async () => {},
    }
  }
  return ctx
}
