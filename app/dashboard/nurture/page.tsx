'use client'

export default function NurtureProPage() {
  return (
    <div className="module-page">
      <header className="module-header">
        <h1 className="module-title">Nurture Pro</h1>
        <p className="module-subtitle">Automated follow-ups and lead nurturing</p>
      </header>

      <div className="cards-row">
        <div className="ios-card">
          <div className="ios-card-label">Active sequences</div>
          <div className="ios-card-value">3</div>
        </div>
        <div className="ios-card">
          <div className="ios-card-label">Contacts in nurture</div>
          <div className="ios-card-value">1,842</div>
        </div>
        <div className="ios-card accent">
          <div className="ios-card-label">Conversion rate</div>
          <div className="ios-card-value">12%</div>
        </div>
      </div>

      <div className="ios-card section-card">
        <h2 className="section-title">Campaigns</h2>
        <ul className="ios-list">
          <li>
            <span>Post-call booking reminder</span>
            <span className="ios-list-badge active">Active</span>
          </li>
          <li>
            <span>No-show follow-up</span>
            <span className="ios-list-badge active">Active</span>
          </li>
          <li>
            <span>New lead welcome</span>
            <span className="ios-list-badge">Paused</span>
          </li>
        </ul>
      </div>

      <div className="ios-card section-card">
        <h2 className="section-title">Recent activity</h2>
        <ul className="ios-list simple">
          <li>Sent 234 follow-up messages today</li>
          <li>12 leads moved to qualified</li>
          <li>3 campaigns triggered this hour</li>
        </ul>
      </div>
    </div>
  )
}
