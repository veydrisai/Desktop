'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useDemoSession } from './DemoSessionProvider'
import RefreshButton from './RefreshButton'
import type { PipelineRow } from '@/lib/demoData'

export default function ConversationPipelineTable() {
  const { pipelineRows, updatePipelineRow, refreshData } = useDemoSession()
  const [editingRow, setEditingRow] = useState<PipelineRow | null>(null)
  const [syncVapiLoading, setSyncVapiLoading] = useState(false)
  const [syncVapiMessage, setSyncVapiMessage] = useState<string | null>(null)

  async function handleSyncVapi() {
    setSyncVapiMessage(null)
    setSyncVapiLoading(true)
    try {
      const res = await fetch('/api/dashboard/sync-vapi', { method: 'POST', credentials: 'include' })
      let data: { error?: string; imported?: number }
      try {
        data = await res.json()
      } catch {
        data = {}
      }
      if (!res.ok) {
        const msg = data?.error || (res.status === 404 ? 'Sync endpoint not found (404). Redeploy the app from Vercel.' : `Sync failed (${res.status})`)
        setSyncVapiMessage(msg)
        return
      }
      setSyncVapiMessage(data.imported && data.imported > 0 ? `Imported ${data.imported} call(s) from Vapi.` : 'No new calls to import.')
      await refreshData()
    } catch {
      setSyncVapiMessage('Sync failed (network or server error)')
    } finally {
      setSyncVapiLoading(false)
    }
  }
  const [editForm, setEditForm] = useState<Omit<PipelineRow, 'id'>>({
    time: '',
    caller: '',
    intent: '',
    outcome: '',
    revenue: 0,
  })

  function openEdit(row: PipelineRow) {
    setEditingRow(row)
    setEditForm({
      time: row.time,
      caller: row.caller,
      intent: row.intent,
      outcome: row.outcome,
      revenue: row.revenue,
    })
  }

  function closeEdit() {
    setEditingRow(null)
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRow) return
    const revenueNum = Number(editForm.revenue)
    updatePipelineRow(editingRow.id, {
      time: editForm.time.trim() || editingRow.time,
      caller: editForm.caller.trim() || editingRow.caller,
      intent: editForm.intent.trim() || editingRow.intent,
      outcome: editForm.outcome.trim() || editingRow.outcome,
      revenue: !Number.isNaN(revenueNum) && revenueNum >= 0 ? revenueNum : editingRow.revenue,
    })
    closeEdit()
  }

  const rowsWithId = pipelineRows.map((r, i) => ({ ...r, id: r.id ?? `legacy_${i}` }))

  return (
    <section className="pipeline-section">
      <div className="pipeline-section-header">
        <h2>Conversation Pipeline</h2>
        <div className="pipeline-actions pipeline-actions-inline">
          <button
            type="button"
            className="refresh-btn"
            onClick={handleSyncVapi}
            disabled={syncVapiLoading}
            aria-label="Import past calls from Vapi"
          >
            {syncVapiLoading ? 'Syncing...' : 'Sync from Vapi'}
          </button>
          <RefreshButton />
          {syncVapiMessage && (
            <span className="sync-vapi-message" style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              {syncVapiMessage}
            </span>
          )}
        </div>
      </div>
      <div className="pipeline-table-wrap">
        <table className="pipeline-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Caller</th>
              <th>Intent</th>
              <th>Outcome</th>
              <th>Revenue</th>
              <th className="pipeline-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pipelineRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-message">
                  No pipeline data. Log in and refresh to load.
                </td>
              </tr>
            ) : (
              rowsWithId.map((row) => (
                <tr key={row.id}>
                  <td>{row.time}</td>
                  <td>{row.caller}</td>
                  <td>{row.intent}</td>
                  <td>{row.outcome}</td>
                  <td>${row.revenue.toLocaleString()}</td>
                  <td className="pipeline-td-actions">
                    <button
                      type="button"
                      className="pipeline-edit-btn"
                      onClick={() => openEdit(row)}
                      aria-label={`Edit lead ${row.caller}`}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingRow && typeof document !== 'undefined' && createPortal(
        <div className="pipeline-modal-backdrop pipeline-modal-backdrop-top" onClick={closeEdit} aria-hidden>
          <div
            className="pipeline-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="pipeline-modal-title"
            aria-modal="true"
          >
            <div className="pipeline-modal-header">
              <h3 id="pipeline-modal-title" className="pipeline-modal-title">Edit lead</h3>
              <p className="pipeline-modal-desc">Update revenue and details for this conversation so your dashboard stays accurate.</p>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="pipeline-modal-form">
                <label className="pipeline-modal-field">
                  <span className="pipeline-modal-label">Time</span>
                  <input
                    type="text"
                    className="pipeline-modal-input"
                    value={editForm.time}
                    onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))}
                    placeholder="e.g. 2:30 PM"
                  />
                </label>
                <label className="pipeline-modal-field">
                  <span className="pipeline-modal-label">Caller</span>
                  <input
                    type="text"
                    className="pipeline-modal-input"
                    value={editForm.caller}
                    onChange={(e) => setEditForm((f) => ({ ...f, caller: e.target.value }))}
                    placeholder="Phone or name"
                  />
                </label>
                <label className="pipeline-modal-field">
                  <span className="pipeline-modal-label">Intent</span>
                  <input
                    type="text"
                    className="pipeline-modal-input"
                    value={editForm.intent}
                    onChange={(e) => setEditForm((f) => ({ ...f, intent: e.target.value }))}
                    placeholder="e.g. Booking, Inquiry"
                  />
                </label>
                <label className="pipeline-modal-field">
                  <span className="pipeline-modal-label">Outcome</span>
                  <input
                    type="text"
                    className="pipeline-modal-input"
                    value={editForm.outcome}
                    onChange={(e) => setEditForm((f) => ({ ...f, outcome: e.target.value }))}
                    placeholder="e.g. Booked, Callback"
                  />
                </label>
                <label className="pipeline-modal-field">
                  <span className="pipeline-modal-label">Revenue ($)</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="pipeline-modal-input"
                    value={editForm.revenue}
                    onChange={(e) => setEditForm((f) => ({ ...f, revenue: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    placeholder="0"
                  />
                </label>
              </div>
              <div className="pipeline-modal-buttons">
                <button type="button" className="pipeline-modal-cancel" onClick={closeEdit}>
                  Cancel
                </button>
                <button type="submit" className="pipeline-modal-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </section>
  )
}
