import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Spinner from '../components/Spinner.jsx'
import { getMyImages, uploadProperty } from '../services/propertyService.js'

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Farmhouse']

function emptyForm() {
  return { title: '', description: '', price: '', location: '', type: '', negotiable: false, images: [] }
}

function MultiImageDropzone({ files, onFilesSelect }) {
  const [isDragging, setIsDragging] = useState(false)
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files])
  useEffect(() => { return () => previews.forEach((p) => URL.revokeObjectURL(p.url)) }, [previews])

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    if (dropped.length === 0) { toast.error('Please drop valid image files.'); return }
    onFilesSelect([...files, ...dropped])
  }

  function handleFileInput(e) {
    const picked = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))
    onFilesSelect([...files, ...picked])
    e.target.value = ''
  }

  function removeImage(index) { onFilesSelect(files.filter((_, i) => i !== index)) }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          isDragging ? 'border-sky-500 bg-sky-50' : 'border-slate-300 bg-slate-50 hover:border-sky-400'
        }`}
      >
        <p className="text-sm font-medium text-slate-700">
          Drag & drop images here, or{' '}
          <label className="cursor-pointer text-sky-600 underline">
            browse
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
          </label>
        </p>
        <p className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP — upload as many as you like</p>
      </div>
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {previews.map((p, i) => (
            <div key={p.url} className="group relative overflow-hidden rounded-xl">
              <img src={p.url} alt={`Preview ${i + 1}`} className="h-20 w-full object-cover" />
              <button type="button" onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition group-hover:opacity-100">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UploadPage() {
  const [form, setForm] = useState(emptyForm)
  const [gallery, setGallery] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGalleryLoading, setIsGalleryLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function loadGallery() {
      setIsGalleryLoading(true)
      try {
        const data = await getMyImages()
        if (isMounted) setGallery(data)
      } catch (error) {
        toast.error(error.response?.data?.message ?? 'Unable to load your uploaded images.')
      } finally {
        if (isMounted) setIsGalleryLoading(false)
      }
    }
    loadGallery()
    return () => { isMounted = false }
  }, [])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim() || !form.description.trim() || !form.price || !form.location.trim()) {
      toast.error('Please complete all fields.')
      return
    }
    if (form.images.length === 0) { toast.error('Please select at least one image.'); return }
    if (Number(form.price) <= 0) { toast.error('Price must be greater than zero.'); return }

    setIsSubmitting(true)
    try {
      await uploadProperty({
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        price: Number(form.price),
        type: form.type,
        negotiable: form.negotiable,
        images: form.images,
      })
      toast.success(`Property uploaded with ${form.images.length} image(s)!`)
      setForm(emptyForm())
      const nextGallery = await getMyImages()
      setGallery(nextGallery)
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('This account is not allowed to upload.')
      } else {
        toast.error(error.response?.data?.message ?? 'Upload failed.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Broker upload</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create a property listing</h1>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
              <input name="title" value={form.title} onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                placeholder="Luxury apartment" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Location</span>
              <input name="location" value={form.location} onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                placeholder="Mumbai" />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
            <textarea name="description" value={form.description} onChange={handleChange} rows="4"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              placeholder="Describe the property..." />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Price (₹)</span>
              <input name="price" type="number" min="1" value={form.price} onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                placeholder="12000000" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Property Type</span>
              <select name="type" value={form.type} onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500">
                <option value="">Select type</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3">
            <input type="checkbox" name="negotiable" checked={form.negotiable} onChange={handleChange}
              className="h-4 w-4 rounded accent-sky-600" />
            <span className="text-sm font-medium text-slate-700">Price is negotiable</span>
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Property images ({form.images.length} selected)
            </span>
            <MultiImageDropzone files={form.images} onFilesSelect={(files) => setForm((c) => ({ ...c, images: files }))} />
          </div>

          <button type="submit" disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300">
            {isSubmitting ? <Spinner label="Uploading..." /> : 'Upload property'}
          </button>
        </form>
      </section>

      <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Your uploaded images</h2>
          <p className="mt-1 text-sm text-slate-500">All images from your property listings.</p>
        </div>
        {isGalleryLoading ? (
          <div className="py-8"><Spinner label="Loading gallery..." /></div>
        ) : gallery.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No uploaded images yet.
          </div>
        ) : (
          <div className="space-y-4">
            {gallery.map((item) => (
              <article key={`${item.propertyId}-${item.imageUrl}`}
                className="overflow-hidden rounded-2xl border border-slate-200">
                <img src={item.imageUrl} alt={item.title} className="h-44 w-full object-cover" />
                <div className="space-y-2 p-4">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Property #{item.propertyId}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </aside>
    </div>
  )
}

export default UploadPage