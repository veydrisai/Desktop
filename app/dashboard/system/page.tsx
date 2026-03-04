'use client'

import Link from 'next/link'

export default function SystemPage() {
  return (
    <div className="module-page">
      <header className="module-header">
        <h1 className="module-title">System</h1>
        <p className="module-subtitle">Status and configuration</p>
      </header>

      <div className="ios-card section-card">
        <h2 className="section-title">Services</h2>
        <ul className="ios-list">
          <li>
            <span>Voice pipeline</span>
            <span className="ios-list-badge status-ok">Operational</span>
          </li>
          <li>
            <span>API gateway</span>
            <span className="ios-list-badge status-ok">Operational</span>
          </li>
          <li>
            <span>CRM sync</span>
            <span className="ios-list-badge status-ok">Operational</span>
          </li>
          <li>
            <span>Webhooks</span>
            <span className="ios-list-badge status-ok">Operational</span>
          </li>
        </ul>
      </div>

      <div className="ios-card section-card">
        <h2 className="section-title">Quick actions</h2>
        <ul className="ios-list">
          <li><Link href="/settings" className="ios-list-link">API keys &amp; integrations</Link></li>
          <li><Link href="/settings" className="ios-list-link">Notification preferences</Link></li>
        </ul>
      </div>

      <div className="ios-card section-card">
        <h2 className="section-title">About</h2>
        <p className="section-description">VoiceROI Terminal · Build 1.0</p>
      </div>
    </div>
  )
}
