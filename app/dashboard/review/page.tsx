'use client'

export default function ReviewBoosterPage() {
  return (
    <div className="module-page">
      <header className="module-header">
        <h1 className="module-title">Review Booster</h1>
        <p className="module-subtitle">Drive and track reviews from conversations</p>
      </header>

      <div className="cards-row">
        <div className="ios-card">
          <div className="ios-card-label">Reviews this month</div>
          <div className="ios-card-value">89</div>
        </div>
        <div className="ios-card">
          <div className="ios-card-label">Avg. rating</div>
          <div className="ios-card-value">4.8</div>
        </div>
        <div className="ios-card accent">
          <div className="ios-card-label">Request rate</div>
          <div className="ios-card-value">68%</div>
        </div>
      </div>

      <div className="ios-card section-card">
        <h2 className="section-title">Channels</h2>
        <ul className="ios-list">
          <li>
            <span>Google</span>
            <span className="ios-list-value">Connected</span>
          </li>
          <li>
            <span>Yelp</span>
            <span className="ios-list-value">Connected</span>
          </li>
          <li>
            <span>Facebook</span>
            <span className="ios-list-value muted">Not set up</span>
          </li>
        </ul>
      </div>

      <div className="ios-card section-card">
        <h2 className="section-title">Prompt template</h2>
        <p className="section-description">Message used after qualified calls to request a review.</p>
        <div className="template-preview">
          &ldquo;Thanks for your time today. If you have a moment, we&rsquo;d love a quick review on Google—it really helps us out.&rdquo;
        </div>
      </div>
    </div>
  )
}
