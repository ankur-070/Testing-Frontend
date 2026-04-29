import { jwtDecode } from 'jwt-decode'

const TOKEN_KEY = 'real-estate-token'
const USER_KEY = 'real-estate-user'

export function decodeToken(token) {
  try {
    return jwtDecode(token)
  } catch {
    return null
  }
}

export function getTokenExpiration(token) {
  const decoded = decodeToken(token)
  if (!decoded?.exp) return null
  return decoded.exp * 1000
}

export function isTokenExpired(token) {
  const expiration = getTokenExpiration(token)
  if (!expiration) return false
  return Date.now() >= expiration
}

export function normalizeRole(role) {
  if (!role) return null
  return role.toString().replace('ROLE_', '').toUpperCase()
}

export function storeSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY)
  if (!rawUser) return null
  try {
    return JSON.parse(rawUser)
  } catch {
    clearStoredSession()
    return null
  }
}