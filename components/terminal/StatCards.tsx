'use client'

import { useDemoSession } from './DemoSessionProvider'

export default function StatCards() {
  const { kpis } = useDemoSession()

  return (
    <div className="stat-cards">
      <div className="stat-card">
        <div className="label">Weekly Call Volume</div>
        <div className="value">{kpis.weeklyCallVolume}</div>
      </div>
      <div className="stat-card">
        <div className="label">Weekly Sales Yield</div>
        <div className="value">{kpis.weeklySalesYield.toFixed(1)}%</div>
      </div>
      <div className="stat-card">
        <div className="label">Monthly Gross Yield</div>
        <div className="value">{kpis.monthlyGrossYield.toFixed(1)}%</div>
      </div>
    </div>
  )
}
