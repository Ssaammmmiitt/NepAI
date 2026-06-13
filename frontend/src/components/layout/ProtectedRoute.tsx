import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'

export function ProtectedRoute() {
  const { user, initialized, initialize, loading } = useAuthStore()

  useEffect(() => {
    if (!initialized) void initialize()
  }, [initialized, initialize])

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dt-bg">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="font-mono text-xs uppercase tracking-[0.06em] text-dt-meta">Loading</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
