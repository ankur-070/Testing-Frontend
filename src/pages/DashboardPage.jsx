import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ChatBot from '../components/ChatBot.jsx'
import EditPropertyModal from '../components/EditPropertyModal.jsx'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyDetailModal from '../components/PropertyDetailModal.jsx'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../context/useAuth.js'
import {
  deleteProperty,
  getAllProperties,
  toggleSold,
} from '../services/propertyService.js'

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office', 'Farmhouse']
const PAGE_SIZE = 6

const roleContent = {
  CUSTOMER: {
    slogan: 'Find Your Dream Home',
    sub: 'Browse thousands of verified listings across India. Your perfect home is just a search away.',
    badge: 'Buyer',
    badgeColor: 'bg-sky-500',
    stats: [
      { label: 'Listed Properties', valueKey: 'total' },
      { label: 'Available Now', valueKey: 'available' },
      { label: 'Cities Covered', value: '20+' },
    ],
  },
  BROKER: {
    slogan: 'Brokery Made Easy',
    sub: 'List properties, track interest, and close deals — all from one powerful dashboard.',
    badge: 'Broker',
    badgeColor: 'bg-emerald-500',
    stats: [
      { label: 'Your Listings', valueKey: 'total' },
      { label: 'Active Listings', valueKey: 'available' },
      { label: 'Platform Reach', value: '10K+' },
    ],
  },
  ADMIN: {
    slogan: 'Platform at a Glance',
    sub: 'Manage listings, monitor activity, and keep the platform running smoothly.',
    badge: 'Admin',
    badgeColor: 'bg-violet-500',
    stats: [
      { label: 'Total Listings', valueKey: 'total' },
      { label: 'Available', valueKey: 'available' },
      { label: 'Sold', valueKey: 'sold' },
    ],
  },
}

function applyFilters(properties, filters, search) {
  return properties.filter((p) => {
    if (filters.type && p.type !== filters.type) return false
    if (filters.budget?.min !== undefined && p.price < filters.budget.min) return false
    if (filters.budget?.max !== undefined && p.price > filters.budget.max) return false
    if (filters.location) {
      if (!p.location?.toLowerCase().includes(filters.location.toLowerCase())) return false
    }
    if (search) {
      const s = search.toLowerCase()
      const searchable = `${p.title} ${p.description} ${p.location} ${p.type ?? ''}`.toLowerCase()
      if (!searchable.includes(s)) return false
    }
    return true
  })
}

function DashboardPage() {
  const { user, isBroker, isAdmin, isBootstrapping } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [editingProperty, setEditingProperty] = useState(null)
  const [chatFilters, setChatFilters] = useState({ type: '', budget: {}, location: '' })
  const [isFiltered, setIsFiltered] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [forbiddenHandled, setForbiddenHandled] = useState(false)

  const role = user?.role ?? 'CUSTOMER'
  const content = useMemo(() => roleContent[role] ?? roleContent.CUSTOMER, [role])

  const statsValues = useMemo(() => ({
    total: properties.length,
    available: properties.filter((p) => !p.sold).length,
    sold: properties.filter((p) => p.sold).length,
  }), [properties])

  useEffect(() => {
    if (location.state?.forbidden && !forbiddenHandled) {
      setForbiddenHandled(true)
      toast.error('You are not authorized to access that page.')
      window.history.replaceState({}, document.title, location.pathname)
    }
  }, [location.state, forbiddenHandled, location.pathname])

  useEffect(() => {
    if (isBootstrapping) return
    let isMounted = true
    async function loadProperties() {
      setIsLoading(true)
      try {
        const data = await getAllProperties()
        if (isMounted) setProperties(data)
      } catch (error) {
        if (isMounted) toast.error(error.response?.data?.message ?? 'Unable to load properties.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadProperties()
    return () => { isMounted = false }
  }, [isBootstrapping])

  const handleDelete = useCallback(async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return
    try {
      await deleteProperty(propertyId)
      setProperties((prev) => prev.filter((p) => p.id !== propertyId))
      toast.success('Property deleted.')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to delete property.')
    }
  }, [])

  const handleToggleSold = useCallback(async (propertyId) => {
    try {
      const updated = await toggleSold(propertyId)
      setProperties((prev) => prev.map((p) => (p.id === propertyId ? updated : p)))
      setSelectedProperty((prev) => (prev?.id === propertyId ? updated : prev))
      toast.success(updated.sold ? 'Marked as sold.' : 'Marked as available.')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to update property.')
    }
  }, [])

  const handleInterestUpdate = useCallback((updatedProperty) => {
    setProperties((prev) => prev.map((p) => (p.id === updatedProperty.id ? updatedProperty : p)))
  }, [])

  const handleEditSave = useCallback((updatedProperty) => {
    setProperties((prev) => prev.map((p) => (p.id === updatedProperty.id ? updatedProperty : p)))
    setEditingProperty(null)
    toast.success('Property updated.')
  }, [])

  const handleFilterChange = useCallback((filters) => {
    setChatFilters(filters)
    const hasFilter =
      filters.type !== '' ||
      Object.keys(filters.budget ?? {}).length > 0 ||
      filters.location !== ''
    setIsFiltered(hasFilter)
    setPage(1)
  }, [])

  const combinedTypeFilter = typeFilter || chatFilters.type

  const filteredProperties = useMemo(
    () => applyFilters(properties, { ...chatFilters, type: combinedTypeFilter }, search),
    [properties, chatFilters, combinedTypeFilter, search],
  )

  const totalPages = Math.ceil(filteredProperties.length / PAGE_SIZE)
  const paginatedProperties = filteredProperties.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  function clearFilters() {
    setChatFilters({ type: '', budget: {}, location: '' })
    setIsFiltered(false)
    setSearch('')
    setTypeFilter('')
    setPage(1)
  }

  return (
    <div className="flex w-full flex-col gap-6">

      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-8 text-white shadow-xl">
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/10" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-sky-400/10" />
        <div className="pointer-events-none absolute right-32 bottom-0 h-32 w-32 rounded-full bg-violet-500/10" />

        <div className="relative">
          {/* Top row — greeting + badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur">
                🏠
              </div>
              <div>
                <p className="text-sm text-slate-400">Welcome back</p>
                <p className="font-semibold text-white">
                  {user?.name ?? user?.email?.split('@')[0]}
                </p>
              </div>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow ${content.badgeColor}`}>
              {content.badge}
            </span>
          </div>

          {/* Slogan */}
          <div className="mt-6">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              {content.slogan}
            </h1>
            <p className="mt-3 max-w-xl text-base text-slate-300 leading-relaxed">
              {content.sub}
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            {content.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm"
              >
                <p className="text-2xl font-bold text-white">
                  {stat.value ?? statsValues[stat.valueKey] ?? '—'}
                </p>
                <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick action pills ── */}
      <div className="flex flex-wrap gap-3">
        {(isBroker || isAdmin) && (
          <>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-2.5 font-semibold text-white shadow transition hover:bg-sky-700 hover:shadow-md"
            >
              <span className="text-lg">＋</span> Upload Property
            </Link>
            <Link
              to="/my-listings"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              📋 My Listings
            </Link>
          </>
        )}
        <Link
          to="/wishlist"
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-2.5 font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100"
        >
          ❤️ Wishlist
        </Link>
      </div>

      {/* ── Search + type filter ── */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search by name, location, type..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500"
        >
          <option value="">All Types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {(search || typeFilter || isFiltered) && (
          <button
            onClick={clearFilters}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Properties grid ── */}
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isFiltered || search || typeFilter
                ? '🔎 Filtered Results'
                : '🏡 Available Properties'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing {paginatedProperties.length} of {filteredProperties.length} properties
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600 ring-1 ring-sky-200 hover:bg-sky-100"
              >
                Clear filters
              </button>
            )}
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
              {filteredProperties.length} listed
            </span>
          </div>
        </div>

        {/* Active filter badges */}
        {isFiltered && (
          <div className="mb-4 flex flex-wrap gap-2">
            {chatFilters.type && (
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                Type: {chatFilters.type}
              </span>
            )}
            {chatFilters.budget?.min !== undefined && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Min: ₹{(chatFilters.budget.min / 100_000).toFixed(0)}L
              </span>
            )}
            {chatFilters.budget?.max !== undefined && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                Max: ₹{(chatFilters.budget.max / 100_000).toFixed(0)}L
              </span>
            )}
            {chatFilters.location && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                📍 {chatFilters.location}
              </span>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="py-16">
            <Spinner label="Loading properties..." />
          </div>
        ) : paginatedProperties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-4xl">🏚️</p>
            <p className="mt-3 text-base font-semibold text-slate-700">
              No properties found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search or clearing filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Show all properties
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              {paginatedProperties.map((property) => (
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
                  onWishlistToggle={handleInterestUpdate}
                />
              ))}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition disabled:opacity-40 hover:bg-slate-50"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      n === page
                        ? 'bg-sky-600 text-white shadow'
                        : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition disabled:opacity-40 hover:bg-slate-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Modals ── */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onInterest={handleInterestUpdate}
        />
      )}

      {editingProperty && (
        <EditPropertyModal
          property={editingProperty}
          onClose={() => setEditingProperty(null)}
          onSave={handleEditSave}
        />
      )}

      {/* ── Floating chatbot ── */}
      <ChatBot onFilterChange={handleFilterChange} properties={properties} />
    </div>
  )
}

export default DashboardPage