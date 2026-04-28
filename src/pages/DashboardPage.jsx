import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../context/useAuth.js'
import { getAllProperties } from '../services/propertyService.js'

const roleContent = {
  CUSTOMER: {
    title: 'Customer dashboard',
    description:
      'Browse listed properties and manage your account session securely.',
  },
  BROKER: {
    title: 'Broker dashboard',
    description:
      'Upload property images, create listings, and review your latest uploads.',
  },
  ADMIN: {
    title: 'Admin dashboard',
    description:
      'Monitor platform access and use broker-only tools when needed.',
  },
}

function DashboardPage() {
  const { user, isBroker, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const content = useMemo(
    () => roleContent[user?.role] ?? roleContent.CUSTOMER,
    [user?.role],
  )

  useEffect(() => {
    if (location.state?.forbidden) {
      toast.error('You are not authorized to access that page.')
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    let isMounted = true

    async function loadProperties() {
      setIsLoading(true)

      try {
        const data = await getAllProperties()

        if (isMounted) {
          setProperties(data)
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message ?? 'Unable to load properties right now.',
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadProperties()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">
          {content.title}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{content.description}</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm text-slate-300">Signed in as</p>
            <p className="mt-2 text-lg font-semibold">{user?.email}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm text-slate-300">Role</p>
            <p className="mt-2 text-lg font-semibold">{user?.role}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm text-slate-300">Actions</p>
            <p className="mt-2 text-lg font-semibold">
              {isBroker || isAdmin ? 'Upload enabled' : 'View-only access'}
            </p>
          </div>
        </div>
      </section>

      {(isBroker || isAdmin) && (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Ready to create a property listing?
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The upload page sends multipart form data to the backend and
                prevents unauthorized users from reaching it.
              </p>
            </div>
            <Link
              to="/upload"
              className="inline-flex rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              Go to upload
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Available properties
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Loaded from `GET /api/properties`.
          </p>
        </div>

        {isLoading ? (
          <div className="py-10">
            <Spinner label="Loading properties..." />
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No properties have been listed yet.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {properties.map((property) => (
              <article
                key={property.id}
                className="overflow-hidden rounded-3xl border border-slate-200"
              >
                <img
                  src={
                    property.imageUrls?.[0] ??
                    'https://placehold.co/800x500/e2e8f0/475569?text=No+Image'
                  }
                  alt={property.title}
                  className="h-56 w-full object-cover"
                />
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {property.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {property.location}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                      ${property.price}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {property.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default DashboardPage
