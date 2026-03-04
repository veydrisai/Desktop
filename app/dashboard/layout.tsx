import '@/app/dashboard/terminal.css'
import { SessionProvider } from '@/contexts/SessionContext'
import { DemoSessionProvider } from '@/components/terminal/DemoSessionProvider'
import { SessionGuard } from '@/components/terminal/SessionGuard'
import DashboardShell from '@/components/terminal/DashboardShell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <SessionGuard>
        <DemoSessionProvider initialLoggedIn>
          <DashboardShell>{children}</DashboardShell>
        </DemoSessionProvider>
      </SessionGuard>
    </SessionProvider>
  )
}
