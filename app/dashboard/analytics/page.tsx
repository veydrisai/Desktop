'use client'

import { useState, useMemo } from 'react'

const DATA_7D = {
  totalConversations: 312,
  avgDuration: '4:32',
  intentMatchRate: 94,
  byOutcome: [
    { outcome: 'Booked', count: 98, pct: 31 },
    { outcome: 'Callback', count: 72, pct: 23 },
    { outcome: 'Qualified', count: 58, pct: 19 },
    { outcome: 'No answer', count: 48, pct: 15 },
    { outcome: 'Not interested', count: 36, pct: 12 },
  ],
  topIntents: [
    { intent: 'Booking', count: 112 },
    { intent: 'Inquiry', count: 89 },
    { intent: 'Support', count: 54 },
    { intent: 'Follow-up', count: 57 },
  ],
}

const DATA_30D = {
  totalConversations: 1247,
  avgDuration: '4:18',
  intentMatchRate: 91,
  byOutcome: [
    { outcome: 'Booked', count: 412, pct: 33 },
    { outcome: 'Callback', count: 298, pct: 24 },
    { outcome: 'Qualified', count: 187, pct: 15 },
    { outcome: 'No answer', count: 198, pct: 16 },
    { outcome: 'Not interested', count: 152, pct: 12 },
  ],
  topIntents: [
    { intent: 'Booking', count: 412 },
    { intent: 'Inquiry', count: 298 },
    { intent: 'Support', count: 187 },
    { intent: 'Follow-up', count: 156 },
  ],
}

export default function ConversationAnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d'>('7d')
  const data = useMemo(() => (range === '7d' ? DATA_7D : DATA_30D), [range])

  return (
    <div className="module-page">
      <header className="module-header">
        <h1 className="module-title">Conversation Analytics</h1>
        <p className="module-subtitle">Insights from call and conversation data</p>
        <div className="module-toolbar">
          <div className="segment-control">
            <button type="button" className={range === '7d' ? 'segment-active' : ''} onClick={() => setRange('7d')}>7 days</button>
            <button type="button" className={range === '30d' ? 'segment-active' : ''} onClick={() => setRange('30d')}>30 days</button>
          </div>
        </div>
      </header>

      <div className="cards-row">
        <div className="ios-card">
          <div className="ios-card-label">Total conversations</div>
          <div className="ios-card-value">{data.totalConversations.toLocaleString()}</div>
        </div>
        <div className="ios-card">
          <div className="ios-card-label">Avg. duration</div>
          <div className="ios-card-value">{data.avgDuration}</div>
        </div>
        <div className="ios-card accent">
          <div className="ios-card-label">Intent match rate</div>
          <div className="ios-card-value">{data.intentMatchRate}%</div>
        </div>
      </div>

      <div className="ios-card section-card">
        <h2 className="section-title">Conversation breakdown by outcome</h2>
        <p className="section-description">Share of conversations by result for the selected period.</p>
        <ul className="ios-list outcome-list">
          {data.byOutcome.map((row) => (
            <li key={row.outcome}>
              <div className="outcome-row">
                <span>{row.outcome}</span>
                <span className="ios-list-value">{row.count} ({row.pct}%)</span>
              </div>
              <div className="outcome-bar-wrap">
                <div className="outcome-bar" style={{ width: `${row.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="ios-card section-card">
        <h2 className="section-title">Top intents</h2>
        <ul className="ios-list">
          {data.topIntents.map((row) => (
            <li key={row.intent}>
              <span>{row.intent}</span>
              <span className="ios-list-value">{row.count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
