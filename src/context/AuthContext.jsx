import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import toast from 'react-hot-toast'
import { setUnauthorizedHandler } from '../services/api.js'
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from '../services/authService.js'
import {
  clearStoredSession,
  getStoredToken,
  getStoredUser,
  isTokenExpired,
  normalizeRole,
  storeSession,
} from '../utils/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken)
  const [user, setUser] = useState(getStoredUser)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const clearSession = useCallback((showMessage = false) => {
    clearStoredSession()
    setToken(null)
    setUser(null)
    if (showMessage) {
      toast.error('Your session has expired. Please log in again.')
    }
  }, [])

  const saveSession = useCallback((nextToken, nextUser) => {
    const normalizedUser = {
      ...nextUser,
      role: normalizeRole(nextUser?.role),
    }
    storeSession(nextToken, normalizedUser)
    setToken(nextToken)
    setUser(normalizedUser)
  }, [])

  // Set global unauthorized handler
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession(false)
      window.location.replace('/login')
    })
  }, [clearSession])

  // Bootstrap — restore and verify session on page load
  useEffect(() => {
    let isMounted = true

    async function bootstrapAuth() {
      const storedToken = getStoredToken()

      if (!storedToken) {
        setIsBootstrapping(false)
        return
      }

      if (isTokenExpired(storedToken)) {
        clearSession(true)
        setIsBootstrapping(false)
        return
      }

      try {
        // ✅ Calls GET /api/users/me to get fresh user data including role
        const currentUser = await getCurrentUser()
        if (isMounted) {
          saveSession(storedToken, currentUser)
        }
      } catch {
        if (isMounted) clearSession(false)
      } finally {
        if (isMounted) setIsBootstrapping(false)
      }
    }

    bootstrapAuth()
    return () => { isMounted = false }
  }, [clearSession, saveSession])

  // Auto logout when token expires
  useEffect(() => {
    if (!token) return
    let expiration = null
    try {
      expiration = JSON.parse(atob(token.split('.')[1])).exp * 1000
    } catch {
      return
    }
    if (!expiration) return
    const delay = Math.max(expiration - Date.now(), 0)
    const timer = window.setTimeout(() => {
      clearSession(true)
      window.location.replace('/login')
    }, delay)
    return () => window.clearTimeout(timer)
  }, [clearSession, token])

  const login = useCallback(async (credentials) => {
    const response = await loginRequest(credentials)
    saveSession(response.token, response.user)
    return response
  }, [saveSession])

  const register = useCallback(async (payload) => {
    const response = await registerRequest(payload)
    saveSession(response.token, response.user)
    return response
  }, [saveSession])

  const logout = useCallback(() => {
    clearSession(false)
    window.location.replace('/login')
  }, [clearSession])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      login,
      register,
      logout,
      clearSession,
      isAdmin: user?.role === 'ADMIN',
      isBroker: user?.role === 'BROKER',
      isCustomer: user?.role === 'CUSTOMER',
    }),
    [clearSession, isBootstrapping, login, logout, register, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
