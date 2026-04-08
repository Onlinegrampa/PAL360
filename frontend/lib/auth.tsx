'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { apiFetch, setToken, removeToken, getToken } from './api'

interface AuthUser {
  client_id: string
  name: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount — restore user from the stored token by decoding the JWT payload
  useEffect(() => {
    const token = getToken()
    if (token) {
      try {
        const segment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(segment))
        const nowSecs = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp > nowSecs) {
          setUser({ client_id: payload.sub, name: '', email: payload.email })
        } else {
          removeToken()
        }
      } catch {
        removeToken()
      }
    }
    setLoading(false)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await apiFetch<{
        access_token: string
        client_id: string
        name: string
        email: string
      }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email, password }),
      })

      setToken(data.access_token)
      setUser({ client_id: data.client_id, name: data.name, email: data.email })
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Login failed' }
    }
  }, [])

  const signOut = useCallback(async () => {
    removeToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
