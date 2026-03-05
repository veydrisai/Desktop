'use client'

import { useDemoSession } from './DemoSessionProvider'

export default function WeeklyRevenuePanel() {
  const { lastSync, kpis, connectStatus } = useDemoSession()
  const isLoading = connectStatus === 'connecting'

  return (
    <section className="revenue-panel">
      <header className="revenue-panel-header">
        <h2>Weekly Performance</h2>
        <span className="revenue-panel-sync">Last sync: {lastSync}</span>
      </header>
      <div className={`revenue-hero${isLoading ? ' skeleton-pulse' : ''}`}>
        <span className="revenue-hero-label">Today&apos;s revenue</span>
        <span className="revenue-hero-value">${(kpis.projectedRevenue || 0).toLocaleString()}</span>
      </div>
      <div className="revenue-secondary">
        <div className="revenue-secondary-item">
          <span className="revenue-secondary-label">Weekly calls</span>
          <span className="revenue-secondary-value">{kpis.weeklyCallVolume.toLocaleString()}</span>
        </div>
        <div className="revenue-secondary-divider" aria-hidden />
        <div className="revenue-secondary-item">
          <span className="revenue-secondary-label">Sales yield</span>
          <span className={`revenue-secondary-value ${kpis.weeklySalesYield > 0 ? 'positive' : ''}`}>
            {kpis.weeklySalesYield.toFixed(1)}%
          </span>
        </div>
      </div>
    </section>
  )
}
