import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SessionExpiredModal } from '@/components/auth/SessionExpiredModal'
import { useAuthStore } from '@/store/authStore'

const REDIRECT_DELAY_MS = 2500

/** Shows expiry modal and redirects to login only when JWT refresh has failed. */
export function SessionExpiredHandler() {
  const sessionExpired = useAuthStore((s) => s.sessionExpired)
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired)
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionExpired) return

    const timer = window.setTimeout(() => {
      clearSessionExpired()
      navigate('/login', { replace: true })
    }, REDIRECT_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [sessionExpired, clearSessionExpired, navigate])

  return <SessionExpiredModal open={sessionExpired} />
}
