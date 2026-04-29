import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import RoleGuard from './components/RoleGuard.jsx'
import { useAuth } from './context/useAuth.js'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MyListingsPage from './pages/MyListingsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import UploadPage from './pages/UploadPage.jsx'
import WishlistPage from './pages/WishlistPage.jsx'

function HomeRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* ✅ Wishlist — no RoleGuard, all logged in users can access */}
            <Route path="/wishlist" element={<WishlistPage />} />

            {/* ✅ My Listings — broker and admin only */}
            <Route
              path="/my-listings"
              element={
                <RoleGuard allowedRoles={['BROKER', 'ADMIN']}>
                  <MyListingsPage />
                </RoleGuard>
              }
            />

            {/* ✅ Upload — broker and admin only */}
            <Route
              path="/upload"
              element={
                <RoleGuard allowedRoles={['BROKER', 'ADMIN']}>
                  <UploadPage />
                </RoleGuard>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App