import React, { createContext, useContext, useEffect, useState } from 'react'
import { setAccessToken } from '../api/client'
import * as authApi from '../api/auth'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to restore session on mount
    authApi
      .refresh()
      .then((data) => {
        setAccessToken(data.accessToken)
        setUser(data.user)
      })
      .catch(() => {
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const data = await authApi.login(email, password)
    setAccessToken(data.accessToken)
    setUser(data.user)
  }

  async function register(name: string, email: string, password: string) {
    await authApi.register(name, email, password)
    await login(email, password)
  }

  async function logout() {
    await authApi.logout().catch(() => {})
    setAccessToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
