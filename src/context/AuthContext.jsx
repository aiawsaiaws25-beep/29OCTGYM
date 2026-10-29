import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { get, post } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const { user } = await get('/api/auth/me')
      setUser(user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      login: async (email, password) => {
        const { user } = await post('/api/auth/login', { email, password })
        setUser(user)
        return user
      },
      signup: async (fields) => {
        const { user } = await post('/api/auth/signup', fields)
        setUser(user)
        return user
      },
      logout: async () => {
        await post('/api/auth/logout')
        setUser(null)
      },
    }),
    [user, loading, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export const avatarFor = (name) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || 'PulseFit')}&backgroundColor=c6ff3d&textColor=0a0c10&fontFamily=Arial&fontWeight=700`
