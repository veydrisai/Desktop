'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, isLoading } = useSession()

  useEffect(() => {
    if (isLoading) return
    if (session?.role === 'client' && !session.onboardingComplete) {
      router.replace('/onboarding')
    }
  }, [session, isLoading, router])

  if (isLoading) {
    return (
      <div className="terminal terminal-loading">
        <p>Loading...</p>
      </div>
    )
  }

  if (session?.role === 'client' && !session.onboardingComplete) {
    return (
      <div className="terminal terminal-loading">
        <p>Redirecting...</p>
      </div>
    )
  }

  return <>{children}</>
}
