'use client'

import { useDemoSession } from './DemoSessionProvider'

export default function WeeklyRevenuePanel() {
  const { lastSync, kpis } = useDemoSession()
  const current = kpis.projectedRevenue
  const lastWeek = Math.round((current || 0) * 0.88)
  const change = lastWeek ? Math.round(((current - lastWeek) / lastWeek) * 100) : 0

  return (
    <section className="revenue-panel">
      <header className="revenue-panel-header">
        <h2>Weekly Revenue Performance</h2>
        <span className="revenue-panel-sync">Last sync: {lastSync}</span>
      </header>
      <div className="revenue-hero">
        <span className="revenue-hero-label">This week</span>
        <span className="revenue-hero-value">${(current || 0).toLocaleString()}</span>
      </div>
      <div className="revenue-secondary">
        <div className="revenue-secondary-item">
          <span className="revenue-secondary-label">Last week</span>
          <span className="revenue-secondary-value">${lastWeek.toLocaleString()}</span>
        </div>
        <div className="revenue-secondary-divider" aria-hidden />
        <div className="revenue-secondary-item">
          <span className="revenue-secondary-label">Week over week</span>
          <span className={`revenue-secondary-value revenue-secondary-change ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        </div>
      </div>
    </section>
  )
}
