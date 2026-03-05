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
        <h2 className="section-title">Quick actions</h2>
        <ul className="ios-list">
          <li><Link href="/settings" className="ios-list-link">API keys &amp; integrations</Link></li>
        </ul>
      </div>

      <div className="ios-card section-card">
        <h2 className="section-title">About</h2>
        <p className="section-description">VoiceROI Terminal</p>
      </div>
    </div>
  )
}
