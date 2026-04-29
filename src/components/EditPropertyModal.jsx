import { useState } from 'react'
import toast from 'react-hot-toast'
import { editProperty } from '../services/propertyService.js'
import Spinner from './Spinner.jsx'

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Farmhouse']

export default function EditPropertyModal({ property, onClose, onSave }) {
  const [form, setForm] = useState({
    title: property.title ?? '',
    description: property.description ?? '',
    price: property.price ?? '',
    location: property.location ?? '',
    type: property.type ?? '',
    negotiable: property.negotiable ?? false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.price || !form.location.trim()) {
      toast.error('Please fill all required fields.')
      return
    }
    setIsSubmitting(true)
    try {
      const updated = await editProperty(property.id, {
        ...form,
        price: Number(form.price),
      })
      onSave(updated)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to update property.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Property</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Title *</span>
              <input name="title" value={form.title} onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Location *</span>
              <input name="location" value={form.location} onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea name="description" value={form.description} onChange={handleChange} rows="3"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Price (₹) *</span>
              <input name="price" type="number" min="1" value={form.price} onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Type</span>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-sky-500">
                <option value="">Select type</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3">
            <input type="checkbox" name="negotiable" checked={form.negotiable} onChange={handleChange}
              className="h-4 w-4 accent-sky-600" />
            <span className="text-sm font-medium text-slate-700">Price is negotiable</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 rounded-2xl bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700 disabled:bg-sky-300">
              {isSubmitting ? <Spinner label="Saving..." /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}