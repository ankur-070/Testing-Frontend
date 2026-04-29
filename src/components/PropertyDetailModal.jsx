import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { expressInterest, toggleWishlist } from '../services/propertyService.js'

const PLACEHOLDER = 'https://placehold.co/800x500/e2e8f0/475569?text=No+Image'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatPrice(price) {
  if (!price) return '—'
  const n = Number(price)
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

export default function PropertyDetailModal({ property, onClose, onInterest }) {
  const [current, setCurrent] = useState(0)
  const [interested, setInterested] = useState(false)
  const [wishlisted, setWishlisted] = useState(property.wishlisted ?? false)
  const timerRef = useRef(null)
  const overlayRef = useRef(null)
  const urls = property.imageUrls?.length > 0 ? property.imageUrls : [PLACEHOLDER]

  useEffect(() => {
    if (urls.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((p) => (p + 1) % urls.length)
      }, 3500)
    }
    return () => clearInterval(timerRef.current)
  }, [urls.length])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleInterest() {
    if (interested) return
    try {
      const updated = await expressInterest(property.id)
      setInterested(true)
      onInterest?.(updated)
      toast.success('Interest registered!')
    } catch {
      toast.error('Could not register interest.')
    }
  }

  async function handleWishlist() {
    try {
      const updated = await toggleWishlist(property.id)
      setWishlisted(updated.wishlisted)
      onInterest?.(updated)
      toast.success(updated.wishlisted ? 'Added to wishlist!' : 'Removed from wishlist.')
    } catch {
      toast.error('Could not update wishlist.')
    }
  }

  function handleContactBroker() {
    if (property.brokerEmail) {
      window.location.href = `mailto:${property.brokerEmail}?subject=Inquiry about ${property.title}`
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
        >✕</button>

        {/* Wishlist button in modal */}
        <button
          onClick={handleWishlist}
          className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow transition hover:bg-white"
        >
          <span className={`text-lg ${wishlisted ? 'text-red-500' : 'text-slate-400'}`}>
            {wishlisted ? '❤️' : '🤍'}
          </span>
        </button>

        {/* Image slider */}
        <div className="relative h-64 flex-shrink-0 overflow-hidden sm:h-80">
          {urls.map((url, i) => (
            <img
              key={url + i}
              src={url}
              alt={`${property.title} ${i + 1}`}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                i === current ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          {urls.length > 1 && (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
              {urls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { clearInterval(timerRef.current); setCurrent(i) }}
                  className={`h-2 rounded-full transition-all ${
                    i === current ? 'w-5 bg-white' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
          {property.sold && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
              <span className="rounded-2xl bg-red-600 px-6 py-2 text-2xl font-bold tracking-widest text-white">SOLD</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{property.title}</h2>
              <p className="mt-1 text-slate-500">{property.location}</p>
              {property.type && (
                <span className="mt-1 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  {property.type}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-sky-600">{formatPrice(property.price)}</p>
              {property.negotiable && (
                <span className="text-sm font-medium text-emerald-600">Price negotiable</span>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
              property.sold ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {property.sold ? '🔴 Sold' : '🟢 Available'}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              👥 {property.interestedCount ?? 0} people interested
            </span>
            {property.negotiable && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700">💬 Negotiable</span>
            )}
          </div>

          <div className="mb-5">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">About this property</h3>
            <p className="leading-7 text-slate-700">{property.description}</p>
          </div>

          <div className="mb-5 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Posted by</p>
              <p className="mt-1 font-medium text-slate-800">{property.brokerName ?? '—'}</p>
              <p className="text-sm text-slate-500">{property.brokerEmail ?? ''}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Posted on</p>
              <p className="mt-1 font-medium text-slate-800">{formatDate(property.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Price</p>
              <p className="mt-1 font-medium text-slate-800">{formatPrice(property.price)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <p className="mt-1 font-medium text-slate-800">{property.sold ? 'Sold' : 'Available'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            {!property.sold && (
              <button
                onClick={handleInterest}
                disabled={interested}
                className="flex-1 rounded-2xl bg-sky-600 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300"
              >
                {interested ? '✓ Interest Registered' : "I'm Interested"}
              </button>
            )}
            <button
              onClick={handleContactBroker}
              className="flex-1 rounded-2xl border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              📧 Contact Broker
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}