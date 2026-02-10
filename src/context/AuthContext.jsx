import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem('admin')
    const token = localStorage.getItem('auth_token')
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const data = await api.login(email, password)
    setUser(data.admin)
    setIsAuthenticated(true)
    localStorage.setItem('admin', JSON.stringify(data.admin))
    return data
  }

  const register = async (name, email, password) => {
    const data = await api.register(name, email, password)
    setUser(data.admin)
    setIsAuthenticated(true)
    localStorage.setItem('admin', JSON.stringify(data.admin))
    return data
  }

  const logout = () => {
    api.logout()
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('admin')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
