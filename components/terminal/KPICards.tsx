'use client'

import { useDemoSession } from './DemoSessionProvider'

export default function KPICards() {
  const { kpis, connectStatus } = useDemoSession()
  const isLoading = connectStatus === 'connecting'

  return (
    <div className="kpi-row">
      <div className={`kpi-card${isLoading ? ' skeleton-pulse' : ''}`}>
        <div className="label">Daily Call Volume</div>
        <div className="value">{isLoading ? '—' : kpis.dailyCallVolume}</div>
      </div>
      <div className={`kpi-card${isLoading ? ' skeleton-pulse' : ''}`}>
        <div className="label">Confirmed Bookings</div>
        <div className="value">{isLoading ? '—' : kpis.confirmedBookings}</div>
      </div>
      <div className={`kpi-card accent${isLoading ? ' skeleton-pulse' : ''}`}>
        <div className="label">Projected Revenue</div>
        <div className="value">{isLoading ? '—' : `$${kpis.projectedRevenue.toLocaleString()}`}</div>
      </div>
    </div>
  )
}
