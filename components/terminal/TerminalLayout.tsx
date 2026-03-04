'use client'

import Sidebar from './Sidebar'
import KPICards from './KPICards'
import WeeklyRevenuePanel from './WeeklyRevenuePanel'
import StatCards from './StatCards'
import ConversationPipelineTable from './ConversationPipelineTable'

export default function TerminalLayout() {
  return (
    <div className="terminal">
      <Sidebar />
      <main className="terminal-main">
        <KPICards />
        <div className="main-grid">
          <WeeklyRevenuePanel />
          <StatCards />
        </div>
        <ConversationPipelineTable />
      </main>
    </div>
  )
}
