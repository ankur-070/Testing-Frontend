import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth()

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace state={{ forbidden: true }} />
  }

  return children
}

export default RoleGuard