import { useEffect, useRef, useState } from 'react'
import { toggleWishlist } from '../services/propertyService.js'

const PLACEHOLDER = 'https://placehold.co/800x500/e2e8f0/475569?text=No+Image'

function ImageCarousel({ images, title, onClick }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)
  const urls = images && images.length > 0 ? images : [PLACEHOLDER]

  function startTimer() {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % urls.length)
    }, 3000)
  }

  function stopTimer() { clearInterval(timerRef.current) }

  useEffect(() => {
    if (urls.length > 1) startTimer()
    return stopTimer
  }, [urls.length])

  function goTo(index) {
    stopTimer()
    setCurrent(index)
    if (urls.length > 1) startTimer()
  }

  return (
    <div
      className="relative h-56 w-full cursor-pointer overflow-hidden bg-slate-100"
      onClick={onClick}
    >
      {urls.map((url, i) => (
        <img
          key={url + i}
          src={url}
          alt={`${title} - image ${i + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      {urls.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i) }}
              className={`h-1.5 rounded-full transition-all ${
                i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
      {urls.length > 1 && (
        <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
          {current + 1} / {urls.length}
        </span>
      )}
    </div>
  )
}

function PropertyCard({
  property,
  currentUserEmail,
  isBroker,
  isAdmin,
  onDelete,
  onToggleSold,
  onEdit,
  onClick,
  onWishlistToggle,
}) {
  const isOwner = property.brokerEmail === currentUserEmail
  const canManage = isOwner || isAdmin
  const [wishlisted, setWishlisted] = useState(property.wishlisted ?? false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  async function handleWishlist(e) {
    e.stopPropagation()
    if (wishlistLoading) return
    setWishlistLoading(true)
    try {
      const updated = await toggleWishlist(property.id)
      setWishlisted(updated.wishlisted)
      onWishlistToggle?.(updated)
    } catch {
      // silent
    } finally {
      setWishlistLoading(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:shadow-md">
      <div className="relative">
        <ImageCarousel
          images={property.imageUrls}
          title={property.title}
          onClick={() => onClick(property)}
        />
        {/* Wishlist heart button */}
        <button
          onClick={handleWishlist}
          disabled={wishlistLoading}
          className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 shadow transition hover:bg-white"
        >
          <span className={`text-lg ${wishlisted ? 'text-red-500' : 'text-slate-400'}`}>
            {wishlisted ? '❤️' : '🤍'}
          </span>
        </button>
        {/* Type badge */}
        {property.type && (
          <span className="absolute left-2 bottom-8 rounded-full bg-sky-600/90 px-2 py-0.5 text-xs font-semibold text-white">
            {property.type}
          </span>
        )}
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              className="cursor-pointer text-lg font-semibold text-slate-900 hover:text-sky-600"
              onClick={() => onClick(property)}
            >
              {property.title}
            </h3>
            <p className="text-sm text-slate-500">{property.location}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              ₹{Number(property.price).toLocaleString('en-IN')}
            </span>
            {property.negotiable && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Negotiable
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {property.sold ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Sold</span>
          ) : (
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Available</span>
          )}
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs text-sky-600">
            {property.interestedCount ?? 0} interested
          </span>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{property.description}</p>

        {canManage && (
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={() => onEdit?.(property)}
              className="flex-1 rounded-xl bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-200"
            >
              Edit
            </button>
            <button
              onClick={() => onToggleSold(property.id)}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                property.sold
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}
            >
              {property.sold ? 'Mark Unsold' : 'Mark Sold'}
            </button>
            <button
              onClick={() => onDelete(property.id)}
              className="flex-1 rounded-xl bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

export default PropertyCard