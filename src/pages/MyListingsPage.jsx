import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import EditPropertyModal from '../components/EditPropertyModal.jsx'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyDetailModal from '../components/PropertyDetailModal.jsx'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../context/useAuth.js'
import { deleteProperty, getMyListings, toggleSold } from '../services/propertyService.js'

export default function MyListingsPage() {
  const { user, isBroker, isAdmin } = useAuth()
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [editingProperty, setEditingProperty] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function load() {
      setIsLoading(true)
      try {
        const data = await getMyListings()
        if (isMounted) setProperties(data)
      } catch {
        toast.error('Unable to load your listings.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  const handleDelete = useCallback(async (propertyId) => {
    if (!window.confirm('Delete this property?')) return
    try {
      await deleteProperty(propertyId)
      setProperties((prev) => prev.filter((p) => p.id !== propertyId))
      toast.success('Property deleted.')
    } catch {
      toast.error('Failed to delete.')
    }
  }, [])

  const handleToggleSold = useCallback(async (propertyId) => {
    try {
      const updated = await toggleSold(propertyId)
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? updated : p)))
      toast.success(updated.sold ? 'Marked as sold.' : 'Marked as available.')
    } catch {
      toast.error('Failed to update.')
    }
  }, [])

  const handleEditSave = useCallback((updated) => {
    setProperties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    setEditingProperty(null)
    toast.success('Property updated.')
  }, [])

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl bg-slate-900 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">My Listings</p>
        <h1 className="mt-2 text-3xl font-semibold">Properties You've Posted</h1>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {isLoading ? (
          <div className="py-10"><Spinner label="Loading listings..." /></div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-2xl">🏠</p>
            <p className="mt-2 text-sm font-medium text-slate-700">No listings yet.</p>
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
                onDelete={handleDelete}
                onToggleSold={handleToggleSold}
                onEdit={setEditingProperty}
                onClick={setSelectedProperty}
                onWishlistToggle={() => {}}
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

      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  )
}