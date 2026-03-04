'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'
import {
  initialKPIs,
  emptyRevenueSeries,
  emptyPipeline,
  defaultLastSync,
  generateRefreshedKPIs,
  generateRevenueSeries,
  generatePipelineRows,
  type KPIs,
  type RevenuePoint,
  type PipelineRow,
} from '@/lib/demoData'

type ConnectStatus = 'idle' | 'connected' | 'unavailable'

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

export function DemoSessionProvider({ children, initialLoggedIn = false }: { children: React.ReactNode; initialLoggedIn?: boolean }) {
  const [state, setState] = useState<DemoSessionState>({
    loggedIn: initialLoggedIn,
    kpis: initialKPIs,
    revenueSeries: emptyRevenueSeries,
    pipelineRows: emptyPipeline,
    lastSync: defaultLastSync,
    connectStatus: 'idle',
  })

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
    setState((prev) => ({
      ...prev,
      loggedIn: true,
      connectStatus: Math.random() > 0.5 ? 'connected' : 'unavailable',
    }))
  }, [])

  const refreshData = useCallback(() => {
    setState((prev) => ({
      ...prev,
      lastSync: 'Just now',
      kpis: generateRefreshedKPIs(prev.kpis),
      revenueSeries: generateRevenueSeries(10),
      pipelineRows: generatePipelineRows(5 + Math.floor(Math.random() * 8)),
    }))
  }, [])

  const updatePipelineRow = useCallback((id: string, updates: Partial<Omit<PipelineRow, 'id'>>) => {
    setState((prev) => ({
      ...prev,
      pipelineRows: prev.pipelineRows.map((row, index) => {
        const rowId = row.id ?? `legacy_${index}`
        return rowId === id ? { ...row, id: row.id ?? id, ...updates } : row
      }),
    }))
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
