'use client'

import { useState } from 'react'

const EMPTY_DATA = {
  totalConversations: 0,
  avgDuration: '0:00',
  intentMatchRate: 0,
  byOutcome: [] as { outcome: string; count: number; pct: number }[],
  topIntents: [] as { intent: string; count: number }[],
}

export default function ConversationAnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d'>('7d')
  const data = EMPTY_DATA
  const hasData = data.totalConversations > 0 || data.byOutcome.length > 0 || data.topIntents.length > 0

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

      {!hasData ? (
        <div className="ios-card section-card" style={{ padding: 24 }}>
          <p className="section-description" style={{ margin: 0, color: 'var(--text-muted)' }}>
            No analytics data yet. Connect Twilio and Vapi in Settings, then use Sync from Vapi on the dashboard to import calls. Data will appear here once conversations are in the system.
          </p>
        </div>
      ) : (
        <>
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

          {data.byOutcome.length > 0 && (
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
          )}

          {data.topIntents.length > 0 && (
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
          )}
        </>
      )}
    </div>
  )
}
