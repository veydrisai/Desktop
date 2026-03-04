'use client'

import { useDemoSession } from './DemoSessionProvider'

export default function KPICards() {
  const { kpis } = useDemoSession()

  return (
    <div className="kpi-row">
      <div className="kpi-card">
        <div className="label">Daily Call Volume</div>
        <div className="value">{kpis.dailyCallVolume}</div>
      </div>
      <div className="kpi-card">
        <div className="label">Confirmed Bookings</div>
        <div className="value">{kpis.confirmedBookings}</div>
      </div>
      <div className="kpi-card accent">
        <div className="label">Projected Revenue</div>
        <div className="value">${kpis.projectedRevenue.toLocaleString()}</div>
      </div>
    </div>
  )
}
