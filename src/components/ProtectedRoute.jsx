import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = useSelector((state) => state.auth.user)
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0) {
    const userRole = user?.role_name || 'Staff'
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}



