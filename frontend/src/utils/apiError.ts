import type { AxiosError } from 'axios'

/**
 * Extract the human-readable error message from an API error response.
 * The backend returns `{ error: "...", ticker?: "..." }` in 4xx bodies.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as AxiosError<{
      error?: string
      detail?: string | { error?: string; msg?: string }[] | { error?: string }
    }>
    const data = axiosErr.response?.data
    if (typeof data?.error === 'string' && data.error) return data.error

    const detail = data?.detail
    if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
      if (typeof detail.error === 'string' && detail.error) return detail.error
    }

    // FastAPI validation errors
    if (Array.isArray(detail)) {
      return detail
        .map((d) => (typeof d === 'object' ? (d.msg ?? d.error ?? String(d)) : d))
        .join(', ')
    }
    if (typeof detail === 'string') return detail
  }
  if (err instanceof Error && err.message && !err.message.startsWith('Request failed with status code')) {
    return err.message
  }
  return fallback
}

export function getApiErrorStatus(err: unknown): number | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as AxiosError
    return axiosErr.response?.status ?? null
  }
  return null
}
