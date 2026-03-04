'use client'

import { useDemoSession } from './DemoSessionProvider'

export default function RefreshButton() {
  const { loggedIn, refreshData } = useDemoSession()

  return (
    <button
      type="button"
      className="refresh-btn"
      onClick={refreshData}
      disabled={!loggedIn}
      aria-disabled={!loggedIn}
    >
      Refresh data
    </button>
  )
}
