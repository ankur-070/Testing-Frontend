import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyDetailModal from '../components/PropertyDetailModal.jsx'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../context/useAuth.js'
import { getWishlist } from '../services/propertyService.js'

export default function WishlistPage() {
  const { user, isBroker, isAdmin } = useAuth()
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      setIsLoading(true)
      try {
        const data = await getWishlist()
        if (isMounted) setProperties(data)
      } catch {
        toast.error('Unable to load wishlist.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  function handleWishlistToggle(updated) {
    if (!updated.wishlisted) {
      setProperties((prev) => prev.filter((p) => p.id !== updated.id))
    } else {
      setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl bg-slate-900 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">Your Wishlist</p>
        <h1 className="mt-2 text-3xl font-semibold">Saved Properties</h1>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {isLoading ? (
          <div className="py-10"><Spinner label="Loading wishlist..." /></div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-2xl">🤍</p>
            <p className="mt-2 text-sm font-medium text-slate-700">No saved properties yet.</p>
            <p className="mt-1 text-sm text-slate-500">Tap the heart on any property to save it.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                currentUserEmail={user?.email}
                isBroker={isBroker}
                isAdmin={isAdmin}
                onDelete={() => {}}
                onToggleSold={() => {}}
                onClick={setSelectedProperty}
                onWishlistToggle={handleWishlistToggle}
              />
            ))}
          </div>
        )}
      </section>

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onInterest={(updated) => setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
        />
      )}
    </div>
  )
}