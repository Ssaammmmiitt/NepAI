import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type {
  AuthResponse,
  Indicators,
  ModelMetadata,
  ModelStatus,
  OHLCRow,
  PortfolioResponse,
  Prediction,
  RefreshResponse,
  StockSummary,
  StockTicker,
  TrainResponse,
  User,
} from '@/types'

const baseURL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

let getAccessToken: () => string | null = () => null
let getRefreshToken: () => string | null = () => null
let onTokensRefreshed: (access: string, refresh: string) => void = () => {}
let onAuthFailure: () => void = () => {}

export function configureAuthHandlers(handlers: {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  onTokensRefreshed: (access: string, refresh: string) => void
  onAuthFailure: () => void
}) {
  getAccessToken = handlers.getAccessToken
  getRefreshToken = handlers.getRefreshToken
  onTokensRefreshed = handlers.onTokensRefreshed
  onAuthFailure = handlers.onAuthFailure
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error)
    }

    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      onAuthFailure()
      return Promise.reject(error)
    }

    if (!refreshPromise) {
      refreshPromise = api
        .post<RefreshResponse>('/auth/refresh', { refresh_token: refreshToken })
        .then((res) => {
          onTokensRefreshed(res.data.access_token, res.data.refresh_token)
          return res.data.access_token
        })
        .catch(() => {
          onAuthFailure()
          return null
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const newToken = await refreshPromise
    if (!newToken) return Promise.reject(error)

    original._retry = true
    original.headers.Authorization = `Bearer ${newToken}`
    return api(original)
  },
)

export const authAPI = {
  signup: (data: { full_name: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
  refresh: (refresh_token: string) =>
    api.post<RefreshResponse>('/auth/refresh', { refresh_token }),
  me: () => api.get<User>('/auth/me'),
}

export const stockAPI = {
  listTickers: () => api.get<StockTicker[]>('/stocks'),
  getOHLC: (ticker: string, from?: string, to?: string) =>
    api.get<OHLCRow[]>(`/stocks/${ticker}/ohlc`, { params: { from, to } }),
  getSummary: (ticker: string) => api.get<StockSummary>(`/stocks/${ticker}/summary`),
  getIndicators: (ticker: string) => api.get<Indicators>(`/stocks/${ticker}/indicators`),
}

export const predictionAPI = {
  getPrediction: (ticker: string, days = 5) =>
    api.get<Prediction>(`/predictions/${ticker}`, { params: { days } }),
}

export const trainAPI = {
  train: (stock_name: string) => api.post<TrainResponse>('/train', { stock_name }),
  status: (ticker: string) => api.get<ModelStatus>(`/model_status/${ticker}`),
}

export const modelAPI = {
  list: () => api.get<ModelMetadata[]>('/models'),
}

export const portfolioAPI = {
  getPortfolio: () => api.get<PortfolioResponse>('/portfolio'),
  addStock: (data: { ticker: string; quantity: number; entry_price: number }) =>
    api.post('/portfolio', data),
  removeStock: (ticker: string) => api.delete(`/portfolio/${ticker}`),
}
