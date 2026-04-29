import { api } from './api.js'

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  return { token: data.token, user: data.user }
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload)
  return { token: data.token, user: data.user }
}

export async function getCurrentUser() {
  const { data } = await api.get('/users/me')
  return data
}