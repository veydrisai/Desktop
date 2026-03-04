export type KPIs = {
  dailyCallVolume: number
  confirmedBookings: number
  projectedRevenue: number
  weeklyCallVolume: number
  weeklySalesYield: number
  monthlyGrossYield: number
}

export type RevenuePoint = { day: string; value: number }

export type PipelineRow = {
  id: string
  time: string
  caller: string
  intent: string
  outcome: string
  revenue: number
}

export const initialKPIs: KPIs = {
  dailyCallVolume: 0,
  confirmedBookings: 0,
  projectedRevenue: 0,
  weeklyCallVolume: 0,
  weeklySalesYield: 0,
  monthlyGrossYield: 0,
}

export const emptyRevenueSeries: RevenuePoint[] = []

export const emptyPipeline: PipelineRow[] = []

export const defaultLastSync = 'No sync yet'

export function generateRefreshedKPIs(previous: KPIs): KPIs {
  return {
    dailyCallVolume: previous.dailyCallVolume + Math.floor(Math.random() * 8) + 2,
    confirmedBookings: previous.confirmedBookings + Math.floor(Math.random() * 3) + 0,
    projectedRevenue: previous.projectedRevenue + Math.floor(Math.random() * 400) + 100,
    weeklyCallVolume: previous.weeklyCallVolume + Math.floor(Math.random() * 15) + 5,
    weeklySalesYield: Math.min(100, (previous.weeklySalesYield + (Math.random() * 4 - 1)) || 12),
    monthlyGrossYield: Math.min(100, (previous.monthlyGrossYield + (Math.random() * 2 - 0.5)) || 8),
  }
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function generateRevenueSeries(count: number = 10): RevenuePoint[] {
  const series: RevenuePoint[] = []
  let v = 1200 + Math.random() * 800
  for (let i = 0; i < count; i++) {
    v = Math.max(400, v + (Math.random() * 400 - 150))
    series.push({ day: DAYS[i % 7] ?? `D${i + 1}`, value: Math.round(v) })
  }
  return series
}

const CALLERS = ['+1 555-0123', '+1 555-0456', 'Jane D.', 'John S.', 'Unknown', '+1 555-0789', 'Maria L.']
const INTENTS = ['Booking', 'Inquiry', 'Support', 'Sales', 'Follow-up']
const OUTCOMES = ['Booked', 'Callback', 'No answer', 'Qualified', 'Not interested']

export function generatePipelineRows(count: number): PipelineRow[] {
  const rows: PipelineRow[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getTime() - i * 3600000)
    rows.push({
      id: `row_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`,
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      caller: CALLERS[Math.floor(Math.random() * CALLERS.length)]!,
      intent: INTENTS[Math.floor(Math.random() * INTENTS.length)]!,
      outcome: OUTCOMES[Math.floor(Math.random() * OUTCOMES.length)]!,
      revenue: Math.floor(Math.random() * 500) + (Math.random() > 0.5 ? 0 : 150),
    })
  }
  return rows
}
