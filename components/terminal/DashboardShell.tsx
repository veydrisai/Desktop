'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/contexts/SessionContext'
import Sidebar from './Sidebar'

const PATH_TO_MODULE: Record<string, string> = {
  '/dashboard': 'performance',
  '/dashboard/analytics': 'analytics',
  '/dashboard/nurture': 'nurture',
  '/dashboard/review': 'review',
  '/dashboard/system': 'system',
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { session } = useSession()

  useEffect(() => {
    if (!session) return
    if (session.role === 'admin') return
    const moduleId = PATH_TO_MODULE[pathname]
    if (!moduleId) return
    const allowed = session.allowedModules ?? ['performance', 'analytics', 'system']
    if (!allowed.includes(moduleId)) {
      router.replace('/dashboard')
    }
  }, [pathname, session, router])

  return (
    <div className="terminal">
      <Sidebar />
      <main className="terminal-main">
        {children}
      </main>
    </div>
  )
}
