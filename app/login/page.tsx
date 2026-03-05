'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import '@/app/login/login.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Login failed')
        setLoading(false)
        return
      }
      const user = data?.user
      if (!user) {
        setError('Invalid response from server')
        setLoading(false)
        return
      }
      if (user.role === 'admin') {
        router.push('/dashboard')
        router.refresh()
        return
      }
      if (user.role === 'client' && !user.onboardingComplete) {
        router.push('/onboarding')
        router.refresh()
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-bg" />
      <div className="auth-card liquid-card">
        <h1 className="auth-title">VoiceROI Terminal</h1>
        <p className="auth-subtitle">Sign in to your account. No sign-up—accounts are created by your admin.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">Email</label>
          <input
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            required
          />
          <label className="auth-label">Password</label>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" className="auth-submit liquid-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-hint">
          No public sign-up. Get an account from your admin. Demo: admin@voiceroi.local / admin
        </p>
      </div>
    </div>
  )
}
