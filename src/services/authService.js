import { api } from './api.js'

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  // ✅ Backend returns {token, user} with name, email, role, id
  return { token: data.token, user: data.user }
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload)
  // ✅ Backend returns {token, user} with name, email, role, id
  return { token: data.token, user: data.user }
}

export async function getCurrentUser() {
  // ✅ /api/users/me exists in backend UserController
  const { data } = await api.get('/users/me')
  return data
}