// Per-user stats (streak, weekly goals, totals) loaded from /api/dashboard.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { get } from '../lib/api'
import { toISODate, weekStartISO } from '../lib/dates'
import { useAuth } from './AuthContext'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  const refreshStats = useCallback(async () => {
    if (!user) {
      setStats(null)
      return
    }
    try {
      const data = await get(`/api/dashboard?today=${toISODate()}&weekStart=${weekStartISO()}`)
      setStats(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [user])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  const value = useMemo(() => ({ stats, statsError: error, refreshStats }), [stats, error, refreshStats])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
