import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

/** Redirects signed-out visits while preserving their requested URL for login. */
export function ProtectedRoute() {
  const session = useAuthStore((state) => state.session)
  const location = useLocation()
  return session ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  )
}
