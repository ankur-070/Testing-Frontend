import { api } from './api.js'

export async function getAllProperties() {
  const { data } = await api.get('/properties')
  return data
}

export async function getMyImages() {
  const { data } = await api.get('/properties/my-images')
  return data
}

export async function uploadProperty(payload) {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  formData.append('price', payload.price)
  formData.append('location', payload.location)
  formData.append('image', payload.image)

  // ✅ No Content-Type header — axios sets multipart + boundary automatically
  const { data } = await api.post('/properties/create', formData)
  return data
}