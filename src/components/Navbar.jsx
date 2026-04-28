import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function navLinkClass({ isActive }) {
  return `rounded-full px-4 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-sky-600 text-white'
      : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
  }`
}

function Navbar() {
  const { isAuthenticated, logout, user, isBroker, isAdmin } = useAuth()

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-semibold text-slate-900">
          Real Estate Portal
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              {(isBroker || isAdmin) && (
                <NavLink to="/upload" className={navLinkClass}>
                  Upload
                </NavLink>
              )}
              <div className="ml-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                {/* ✅ name from backend UserResponse, fallback to email */}
                {user?.name ?? user?.email} ({user?.role ?? 'CUSTOMER'})
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={navLinkClass}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar