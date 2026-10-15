import { useEffect, useState } from 'react'
import api from '../services/api'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('jprints_token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/me')
        setUser(response.data.user ?? response.data)
      } catch {
        localStorage.removeItem('jprints_token')
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [])

  async function login(email, password) {
    const response = await api.post('/login', { email, password })

    const token = response.data.token ?? response.data.access_token

    if (!token) {
      throw new Error('The login response did not include an access token.')
    }

    localStorage.setItem('jprints_token', token)

    try {
      const profile = await api.get('/me')
      const loggedInUser = profile.data.user ?? profile.data
      setUser(loggedInUser)
      return loggedInUser
    } catch (error) {
      localStorage.removeItem('jprints_token')
      throw error
    }
  }

  async function register(data) {
    return api.post('/register', data)
  }

  async function logout() {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('jprints_token')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}