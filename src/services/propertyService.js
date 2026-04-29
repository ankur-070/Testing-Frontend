import { api } from './api.js'

export async function getAllProperties() {
  const { data } = await api.get('/properties')
  return data
}

export async function getMyImages() {
  const { data } = await api.get('/properties/my-images')
  return data
}

export async function getMyListings() {
  const { data } = await api.get('/properties/my-listings')
  return data
}

export async function getWishlist() {
  const { data } = await api.get('/properties/wishlist')
  return data
}

export async function uploadProperty(payload) {
  const formData = new FormData()
  formData.append('title', payload.title)
  formData.append('description', payload.description)
  formData.append('price', payload.price)
  formData.append('location', payload.location)
  formData.append('type', payload.type ?? '')
  formData.append('negotiable', payload.negotiable ?? false)

  const images = Array.isArray(payload.images) ? payload.images : [payload.image]
  images.forEach((img) => { if (img) formData.append('images', img) })

  const { data } = await api.post('/properties/create', formData)
  return data
}

export async function editProperty(propertyId, payload) {
  const { data } = await api.put(`/properties/${propertyId}`, payload)
  return data
}

export async function deleteProperty(propertyId) {
  await api.delete(`/properties/${propertyId}`)
}

export async function toggleSold(propertyId) {
  const { data } = await api.put(`/properties/${propertyId}/toggle-sold`)
  return data
}

export async function expressInterest(propertyId) {
  const { data } = await api.post(`/properties/${propertyId}/interest`)
  return data
}

export async function toggleWishlist(propertyId) {
  const { data } = await api.post(`/properties/${propertyId}/wishlist`)
  return data
}