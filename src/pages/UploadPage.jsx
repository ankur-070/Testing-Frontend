import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import FileDropzone from '../components/FileDropzone.jsx'
import Spinner from '../components/Spinner.jsx'
import { getMyImages, uploadProperty } from '../services/propertyService.js'

function emptyForm() {
  return {
    title: '',
    description: '',
    price: '',
    location: '',
    image: null,
  }
}

function UploadPage() {
  const [form, setForm] = useState(emptyForm)
  const [gallery, setGallery] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGalleryLoading, setIsGalleryLoading] = useState(true)

  const previewUrl = useMemo(() => {
    if (!form.image) {
      return ''
    }

    return URL.createObjectURL(form.image)
  }, [form.image])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    let isMounted = true

    async function loadGallery() {
      setIsGalleryLoading(true)

      try {
        const data = await getMyImages()

        if (isMounted) {
          setGallery(data)
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message ?? 'Unable to load your uploaded images.',
        )
      } finally {
        if (isMounted) {
          setIsGalleryLoading(false)
        }
      }
    }

    loadGallery()

    return () => {
      isMounted = false
    }
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file.')
      return
    }

    setForm((current) => ({ ...current, image: file }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.price ||
      !form.location.trim() ||
      !form.image
    ) {
      toast.error('Please complete all fields and select an image.')
      return
    }

    if (Number(form.price) <= 0) {
      toast.error('Price must be greater than zero.')
      return
    }

    setIsSubmitting(true)

    try {
      await uploadProperty({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        price: Number(form.price),
      })

      toast.success('Property uploaded successfully.')
      setForm(emptyForm())

      const nextGallery = await getMyImages()
      setGallery(nextGallery)
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('This account is not allowed to upload. Please log in again after verifying the role is ADMIN or BROKER.')
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
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            Broker upload
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Create a property listing
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This form maps directly to `POST /api/properties/create`.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Title
              </span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
                placeholder="Luxury apartment"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Location
              </span>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
                placeholder="Mumbai"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </span>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
              placeholder="Describe the property"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Price
            </span>
            <input
              name="price"
              type="number"
              min="1"
              value={form.price}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500"
              placeholder="12000000"
            />
          </label>

          <FileDropzone
            file={form.image}
            previewUrl={previewUrl}
            onFileSelect={handleFileSelect}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
          >
            {isSubmitting ? <Spinner label="Uploading..." /> : 'Upload property'}
          </button>
        </form>
      </section>

      <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Your uploaded images
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Loaded from `GET /api/properties/my-images`.
          </p>
        </div>

        {isGalleryLoading ? (
          <div className="py-8">
            <Spinner label="Loading gallery..." />
          </div>
        ) : gallery.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No uploaded images yet.
          </div>
        ) : (
          <div className="space-y-4">
            {gallery.map((item) => (
              <article
                key={`${item.propertyId}-${item.imageUrl}`}
                className="overflow-hidden rounded-2xl border border-slate-200"
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-44 w-full object-cover"
                />
                <div className="space-y-2 p-4">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Property #{item.propertyId}
                  </p>
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
