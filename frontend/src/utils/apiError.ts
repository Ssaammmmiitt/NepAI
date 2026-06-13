import type { AxiosError } from 'axios'

/**
 * Extract the human-readable error message from an API error response.
 * The backend returns `{ error: "...", ticker?: "..." }` in 4xx bodies.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as AxiosError<{ error?: string; detail?: string | { msg: string }[] }>
    const data = axiosErr.response?.data
    if (typeof data?.error === 'string' && data.error) return data.error
    // FastAPI validation errors
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d) => (typeof d === 'object' ? d.msg : d)).join(', ')
    }
    if (typeof data?.detail === 'string') return data.detail
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function getApiErrorStatus(err: unknown): number | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as AxiosError
    return axiosErr.response?.status ?? null
  }
  return null
}
