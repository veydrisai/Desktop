'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  initialKPIs,
  emptyRevenueSeries,
  emptyPipeline,
  defaultLastSync,
  type KPIs,
  type RevenuePoint,
  type PipelineRow,
} from '@/lib/demoData'

type ConnectStatus = 'idle' | 'connecting' | 'connected' | 'unavailable'

type DemoSessionState = {
  loggedIn: boolean
  kpis: KPIs
  revenueSeries: RevenuePoint[]
  pipelineRows: PipelineRow[]
  lastSync: string
  connectStatus: ConnectStatus
}

type DemoSessionContextValue = DemoSessionState & {
  setLoggedIn: (value: boolean) => void
  connectDashboard: () => void
  refreshData: () => void
  updatePipelineRow: (id: string, updates: Partial<Omit<PipelineRow, 'id'>>) => void
}

const DemoSessionContext = createContext<DemoSessionContextValue | null>(null)

async function fetchDashboardData(): Promise<{ kpis: KPIs; pipelineRows: PipelineRow[]; lastSync: string } | null> {
  try {
    const res = await fetch('/api/dashboard/data', { credentials: 'include' })
    if (!res.ok) return null
    const data = await res.json()
    return {
      kpis: data.kpis ?? initialKPIs,
      pipelineRows: Array.isArray(data.pipelineRows) ? data.pipelineRows : emptyPipeline,
      lastSync: data.lastSync ?? defaultLastSync,
    }
  } catch {
    return null
  }
}

export function DemoSessionProvider({ children, initialLoggedIn = false }: { children: React.ReactNode; initialLoggedIn?: boolean }) {
  const [state, setState] = useState<DemoSessionState>({
    loggedIn: initialLoggedIn,
    kpis: initialKPIs,
    revenueSeries: emptyRevenueSeries,
    pipelineRows: emptyPipeline,
    lastSync: defaultLastSync,
    connectStatus: 'idle',
  })

  const loadDashboardData = useCallback(async (setStatus = true) => {
    if (setStatus) setState((prev) => ({ ...prev, connectStatus: 'connecting' }))
    const data = await fetchDashboardData()
    if (data) {
      setState((prev) => ({
        ...prev,
        kpis: data.kpis,
        pipelineRows: data.pipelineRows,
        lastSync: data.lastSync,
        ...(setStatus && { connectStatus: 'connected' as const }),
      }))
    } else if (setStatus) {
      setState((prev) => ({ ...prev, connectStatus: 'unavailable' }))
    }
  }, [])

  useEffect(() => {
    if (state.loggedIn) loadDashboardData(true)
  }, [state.loggedIn, loadDashboardData])

  const setLoggedIn = useCallback((value: boolean) => {
    setState((prev) => {
      if (value) return { ...prev, loggedIn: true }
      return {
        loggedIn: false,
        kpis: initialKPIs,
        revenueSeries: emptyRevenueSeries,
        pipelineRows: emptyPipeline,
        lastSync: defaultLastSync,
        connectStatus: 'idle',
      }
    })
  }, [])

  const connectDashboard = useCallback(() => {
    setState((prev) => ({ ...prev, loggedIn: true }))
    loadDashboardData(true)
  }, [loadDashboardData])

  const refreshData = useCallback(async () => {
    setState((prev) => ({ ...prev, connectStatus: 'connecting' }))
    const data = await fetchDashboardData()
    if (data) {
      setState((prev) => ({
        ...prev,
        kpis: data.kpis,
        pipelineRows: data.pipelineRows,
        lastSync: data.lastSync,
        connectStatus: 'connected',
      }))
    } else {
      setState((prev) => ({
        ...prev,
        connectStatus: 'unavailable',
      }))
    }
  }, [])

  const updatePipelineRow = useCallback((id: string, updates: Partial<Omit<PipelineRow, 'id'>>) => {
    setState((prev) => ({
      ...prev,
      pipelineRows: prev.pipelineRows.map((row, index) => {
        const rowId = row.id ?? `legacy_${index}`
        return rowId === id ? { ...row, id: row.id ?? id, ...updates } : row
      }),
    }))

    if (!id.startsWith('legacy_') && (updates.intent !== undefined || updates.outcome !== undefined || updates.revenue !== undefined)) {
      fetch(`/api/dashboard/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          intent: updates.intent,
          outcome: updates.outcome,
          revenue: updates.revenue,
        }),
      }).catch(() => {})
    }
  }, [])

  const value: DemoSessionContextValue = {
    ...state,
    setLoggedIn,
    connectDashboard,
    refreshData,
    updatePipelineRow,
  }

  return (
    <DemoSessionContext.Provider value={value}>
      {children}
    </DemoSessionContext.Provider>
  )
}

export function useDemoSession() {
  const ctx = useContext(DemoSessionContext)
  if (!ctx) throw new Error('useDemoSession must be used within DemoSessionProvider')
  return ctx
}
