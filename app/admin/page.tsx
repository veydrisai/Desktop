'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import '@/app/dashboard/terminal.css'
import '@/app/admin/admin.css'
import { SessionProvider } from '@/contexts/SessionContext'
import { DemoSessionProvider } from '@/components/terminal/DemoSessionProvider'
import { SessionGuard } from '@/components/terminal/SessionGuard'
import Sidebar from '@/components/terminal/Sidebar'
import { MODULES_NAV, DEFAULT_CLIENT_MODULES } from '@/lib/moduleConfig'

type Client = { id: string; email: string; onboardingComplete: boolean; allowedModules?: string[]; createdAt: string }

type RevenueSettings = { defaultRevenuePerBooking?: number; currency?: string }

export default function AdminPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [modules, setModules] = useState<string[]>(() => [...DEFAULT_CLIENT_MODULES])
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [revenueDefault, setRevenueDefault] = useState('')
  const [revenueCurrency, setRevenueCurrency] = useState('USD')
  const [revenueSaving, setRevenueSaving] = useState(false)
  const [revenueMessage, setRevenueMessage] = useState<string | null>(null)

  function toggleModule(id: string) {
    setModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  function loadClientRevenue(clientId: string) {
    setSelectedClientId(clientId)
    setRevenueMessage(null)
    if (!clientId) {
      setRevenueDefault('')
      setRevenueCurrency('USD')
      return
    }
    fetch(`/api/admin/clients/${clientId}/revenue-settings`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { settings?: RevenueSettings }) => {
        const s = data?.settings
        setRevenueDefault(s?.defaultRevenuePerBooking != null ? String(s.defaultRevenuePerBooking) : '')
        setRevenueCurrency(s?.currency ?? 'USD')
      })
      .catch(() => setRevenueMessage('Failed to load'))
  }

  async function handleSaveClientRevenue(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClientId) return
    setRevenueMessage(null)
    setRevenueSaving(true)
    try {
      const res = await fetch(`/api/admin/clients/${selectedClientId}/revenue-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          defaultRevenuePerBooking: revenueDefault === '' ? undefined : Number(revenueDefault),
          currency: revenueCurrency || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRevenueMessage(data?.error || 'Failed to save')
        return
      }
      setRevenueMessage('Revenue settings saved for this client.')
    } catch {
      setRevenueMessage('Something went wrong')
    } finally {
      setRevenueSaving(false)
    }
  }

  useEffect(() => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then((r) => {
        if (r.status === 401) {
          router.replace('/dashboard')
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data?.clients) setClients(data.clients)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, modules }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'err', text: data?.error || 'Failed to create user' })
        return
      }
      const user = data?.user
      if (!user) {
        setMessage({ type: 'err', text: 'Invalid response from server' })
        return
      }
      setMessage({ type: 'ok', text: `Created ${user.email}. Share these credentials with the client.` })
      setEmail('')
      setPassword('')
      setClients((prev) => [...prev, { id: user.id, email: user.email, onboardingComplete: user.onboardingComplete ?? false, allowedModules: user.allowedModules ?? [], createdAt: '' }])
    } catch {
      setMessage({ type: 'err', text: 'Something went wrong' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <SessionProvider>
      <SessionGuard>
        <DemoSessionProvider>
          <div className="terminal">
            <Sidebar />
            <main className="terminal-main admin-main">
              <h1 className="admin-title">Client accounts</h1>
              <p className="admin-desc">Create new client logins. They will be prompted to add API keys on first sign-in.</p>

              <div className="admin-card liquid-card">
                <h2 className="admin-card-title">Create new client</h2>
                <form onSubmit={handleCreate} className="admin-form">
                  <label className="auth-label">Client email</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@company.com"
                    required
                  />
                  <label className="auth-label">Set password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                  <div className="admin-modules">
                    <span className="auth-label">Packages &amp; modules</span>
                    <p className="admin-modules-hint">Choose which modules this client can access.</p>
                    {MODULES_NAV.map((m) => (
                      <label key={m.id} className="admin-module-check">
                        <input
                          type="checkbox"
                          checked={modules.includes(m.id)}
                          onChange={() => toggleModule(m.id)}
                        />
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>
                  {message && (
                    <p className={message.type === 'ok' ? 'admin-msg-ok' : 'auth-error'} role="alert">
                      {message.text}
                    </p>
                  )}
                  <button type="submit" className="auth-submit liquid-btn" disabled={creating}>
                    {creating ? 'Creating…' : 'Create account'}
                  </button>
                </form>
              </div>

              <div className="admin-card liquid-card">
                <h2 className="admin-card-title">Existing clients</h2>
                {loading ? (
                  <p className="admin-muted">Loading…</p>
                ) : clients.length === 0 ? (
                  <p className="admin-muted">No client accounts yet.</p>
                ) : (
                  <ul className="admin-list">
                    {clients.map((c) => (
                      <li key={c.id} className="admin-list-item">
                        <span className="admin-list-email">{c.email}</span>
                        <span className={`admin-list-badge ${c.onboardingComplete ? 'done' : 'pending'}`}>
                          {c.onboardingComplete ? 'Onboarded' : 'Pending setup'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="admin-card liquid-card">
                <h2 className="admin-card-title">Manage client revenue</h2>
                <p className="admin-desc">Set default revenue per booking and currency per client. Clients can also change their own in Settings.</p>
                {clients.length === 0 ? (
                  <p className="admin-muted">Create a client first.</p>
                ) : (
                  <form onSubmit={handleSaveClientRevenue} className="admin-form">
                    <label className="auth-label">Client</label>
                    <select
                      className="auth-input"
                      value={selectedClientId}
                      onChange={(e) => loadClientRevenue(e.target.value)}
                    >
                      <option value="">Select a client…</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.email}</option>
                      ))}
                    </select>
                    {selectedClientId && (
                      <>
                        <label className="auth-label">Default revenue per booking ($)</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="auth-input"
                          value={revenueDefault}
                          onChange={(e) => setRevenueDefault(e.target.value)}
                          placeholder="e.g. 150"
                        />
                        <label className="auth-label">Currency</label>
                        <input
                          type="text"
                          className="auth-input"
                          value={revenueCurrency}
                          onChange={(e) => setRevenueCurrency(e.target.value)}
                          placeholder="USD"
                        />
                        {revenueMessage && (
                          <p className={revenueMessage.startsWith('Revenue') ? 'admin-msg-ok' : 'auth-error'} role="alert">
                            {revenueMessage}
                          </p>
                        )}
                        <button type="submit" className="auth-submit liquid-btn" disabled={revenueSaving}>
                          {revenueSaving ? 'Saving…' : 'Save revenue for this client'}
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>
            </main>
          </div>
        </DemoSessionProvider>
      </SessionGuard>
    </SessionProvider>
  )
}
