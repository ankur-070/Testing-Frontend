import axios from 'axios'
import {
  clearStoredSession,
  getStoredToken,
  isTokenExpired,
} from '../utils/auth.js'

let unauthorizedHandler = null

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
})

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (!token) return config

  if (isTokenExpired(token)) {
    clearStoredSession()
    unauthorizedHandler?.()
    throw new axios.CanceledError('Session expired')
  }

  config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof axios.CanceledError) return Promise.reject(error)
    if (error.response?.status === 401) {
      clearStoredSession()
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)