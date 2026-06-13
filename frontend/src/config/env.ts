/**
 * Centralized frontend environment config (Vite `import.meta.env`).
 * Only variables prefixed with VITE_ are exposed to the browser.
 */

function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '')
  return trimmed || '/api'
}

export const env = {
  /** Axios base URL — from VITE_API_URL, defaults to /api */
  apiUrl: normalizeApiUrl(import.meta.env.VITE_API_URL ?? '/api'),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const
