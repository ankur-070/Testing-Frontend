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

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession(false)
      window.location.replace('/login')
    })
  }, [clearSession])

  // ✅ Bootstrap — restore session on page load
  useEffect(() => {
    let isMounted = true

    async function bootstrapAuth() {
      const storedToken = getStoredToken()

      // ✅ No token — not logged in, stop bootstrapping immediately
      if (!storedToken) {
        if (isMounted) setIsBootstrapping(false)
        return
      }

      // ✅ Token expired — clear and stop
      if (isTokenExpired(storedToken)) {
        if (isMounted) {
          clearSession(true)
          setIsBootstrapping(false)
        }
        return
      }

      // ✅ Try to get fresh user from backend
      // If it fails, still use stored user so app doesn't break
      try {
        const currentUser = await getCurrentUser()
        if (isMounted) {
          saveSession(storedToken, currentUser)
        }
      } catch {
        // ✅ Backend call failed — use stored user instead of clearing session
        // This prevents logout on temporary network issues
        const storedUser = getStoredUser()
        if (isMounted && storedUser) {
          setToken(storedToken)
          setUser(storedUser)
        } else if (isMounted) {
          clearSession(false)
        }
      } finally {
        // ✅ Always stop bootstrapping no matter what
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
