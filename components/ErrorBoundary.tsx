'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="terminal terminal-loading" style={{ flexDirection: 'column', gap: '12px' }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Something went wrong</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            The app hit an error. Try refreshing the page.
          </p>
          <button
            type="button"
            className="auth-submit"
            style={{ marginTop: 8 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
